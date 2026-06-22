/**
 * FreelanceChain Scalability Layer — Request Queue & Rate Limiter
 * 
 * Prevents API throttling (429 errors) by queuing and rate-limiting 
 * all outbound requests to Stellar Horizon & Soroban RPC.
 * 
 * Features:
 * - Configurable concurrency limit (max parallel requests)
 * - Rate limiting (max N requests per window)
 * - Automatic retry with exponential backoff
 * - Request deduplication (same key = same promise)
 * - Priority queue (urgent txs > background indexing)
 */

const PRIORITY = { URGENT: 0, NORMAL: 1, LOW: 2 };

class RequestQueue {
  constructor({
    maxConcurrent = 4,
    maxPerSecond = 8,
    retryAttempts = 3,
    retryBaseDelay = 1000,
  } = {}) {
    this.maxConcurrent = maxConcurrent;
    this.maxPerSecond = maxPerSecond;
    this.retryAttempts = retryAttempts;
    this.retryBaseDelay = retryBaseDelay;

    this._queue = [];           // { fn, resolve, reject, priority, key }
    this._activeCount = 0;
    this._timestamps = [];      // track call timestamps for rate-limiting
    this._inflightKeys = {};    // deduplication: key → Promise
    this._stats = { queued: 0, completed: 0, failed: 0, deduplicated: 0 };
  }

  /**
   * Enqueue a request function.
   * @param {Function} fn        — Async function to execute
   * @param {Object}   opts
   * @param {string}   opts.key      — Unique key for deduplication (optional)
   * @param {number}   opts.priority — PRIORITY enum
   * @returns {Promise}
   */
  enqueue(fn, { key = null, priority = PRIORITY.NORMAL } = {}) {
    // Deduplication: if same key is already in-flight, return same promise
    if (key && this._inflightKeys[key]) {
      this._stats.deduplicated++;
      return this._inflightKeys[key];
    }

    const promise = new Promise((resolve, reject) => {
      this._queue.push({ fn, resolve, reject, priority, key });
      this._queue.sort((a, b) => a.priority - b.priority);
      this._stats.queued++;
    });

    if (key) this._inflightKeys[key] = promise;

    // Always chain cleanup
    promise.finally(() => {
      if (key) delete this._inflightKeys[key];
    });

    this._processQueue();
    return promise;
  }

  async _processQueue() {
    while (this._queue.length > 0 && this._activeCount < this.maxConcurrent) {
      // Rate-limit check
      if (!this._canProceed()) {
        setTimeout(() => this._processQueue(), 150);
        return;
      }

      const item = this._queue.shift();
      this._activeCount++;
      this._recordTimestamp();

      this._executeWithRetry(item)
        .then(item.resolve)
        .catch(item.reject)
        .finally(() => {
          this._activeCount--;
          this._processQueue();
        });
    }
  }

  async _executeWithRetry({ fn, key }) {
    let lastError;
    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        const result = await fn();
        this._stats.completed++;
        return result;
      } catch (err) {
        lastError = err;
        const isRetryable = this._isRetryable(err);
        if (!isRetryable || attempt === this.retryAttempts) break;

        const delay = this.retryBaseDelay * Math.pow(2, attempt) + Math.random() * 500;
        console.warn(`[RequestQueue] Retry ${attempt + 1}/${this.retryAttempts} for ${key || 'unknown'} in ${Math.round(delay)}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    this._stats.failed++;
    throw lastError;
  }

  _isRetryable(err) {
    const msg = err?.message || '';
    // Retry on rate-limit, timeout, network errors
    return (
      msg.includes('429') ||
      msg.includes('timeout') ||
      msg.includes('ECONNREFUSED') ||
      msg.includes('fetch failed') ||
      msg.includes('NetworkError') ||
      msg.includes('503') ||
      msg.includes('Too Many Requests')
    );
  }

  _canProceed() {
    const now = Date.now();
    this._timestamps = this._timestamps.filter(t => now - t < 1000);
    return this._timestamps.length < this.maxPerSecond;
  }

  _recordTimestamp() {
    this._timestamps.push(Date.now());
  }

  getStats() {
    return {
      ...this._stats,
      active: this._activeCount,
      pending: this._queue.length,
      inflight: Object.keys(this._inflightKeys).length,
    };
  }

  // Drain the queue (cancel pending)
  clear() {
    this._queue.forEach(item => item.reject(new Error('Queue cleared')));
    this._queue = [];
    this._inflightKeys = {};
  }
}

// ── Singleton instances ──────────────────────────────────────────────────────
// Separate queues for different backends to avoid head-of-line blocking
export const sorobanQueue = new RequestQueue({
  maxConcurrent: 3,   // Soroban RPC is more restrictive
  maxPerSecond: 5,
  retryAttempts: 3,
});

export const horizonQueue = new RequestQueue({
  maxConcurrent: 6,   // Horizon can handle more
  maxPerSecond: 10,
  retryAttempts: 2,
});

export { PRIORITY };
export default RequestQueue;
