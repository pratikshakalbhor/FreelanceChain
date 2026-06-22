/**
 * FreelanceChain — Performance Monitor
 * 
 * Real-time performance metrics visible in the Monitoring page.
 * Tracks: render times, API latency, cache hit rates, memory usage.
 */

class PerformanceMonitor {
  constructor() {
    this._metrics = {
      apiCalls: [],         // { label, duration, timestamp, success }
      renderTimes: [],      // { component, duration, timestamp }
      memorySnapshots: [],  // { used, total, timestamp }
      errors: [],           // { message, source, timestamp }
    };
    this._maxEntries = 100;
  }

  /** Track an API call duration */
  trackApiCall(label, durationMs, success = true) {
    this._metrics.apiCalls.push({
      label,
      duration: Math.round(durationMs),
      timestamp: Date.now(),
      success,
    });
    this._trim('apiCalls');
  }

  /** Track a component render time */
  trackRender(component, durationMs) {
    this._metrics.renderTimes.push({
      component,
      duration: Math.round(durationMs),
      timestamp: Date.now(),
    });
    this._trim('renderTimes');
  }

  /** Track an error */
  trackError(message, source = 'unknown') {
    this._metrics.errors.push({
      message: typeof message === 'string' ? message : message?.message || 'Unknown error',
      source,
      timestamp: Date.now(),
    });
    this._trim('errors');
  }

  /** Snapshot memory usage (if API available) */
  snapshotMemory() {
    if (typeof performance !== 'undefined' && performance.memory) {
      this._metrics.memorySnapshots.push({
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now(),
      });
      this._trim('memorySnapshots');
    }
  }

  /** Get aggregated metrics summary */
  getSummary() {
    const apiCalls = this._metrics.apiCalls;
    const avgApiLatency = apiCalls.length > 0
      ? apiCalls.reduce((sum, c) => sum + c.duration, 0) / apiCalls.length
      : 0;
    const apiSuccessRate = apiCalls.length > 0
      ? (apiCalls.filter(c => c.success).length / apiCalls.length * 100)
      : 100;

    const renders = this._metrics.renderTimes;
    const avgRenderTime = renders.length > 0
      ? renders.reduce((sum, r) => sum + r.duration, 0) / renders.length
      : 0;

    const latestMemory = this._metrics.memorySnapshots.length > 0
      ? this._metrics.memorySnapshots[this._metrics.memorySnapshots.length - 1]
      : null;

    return {
      apiCalls: {
        total: apiCalls.length,
        avgLatency: Math.round(avgApiLatency),
        successRate: apiSuccessRate.toFixed(1) + '%',
        recent: apiCalls.slice(-10),
      },
      renders: {
        total: renders.length,
        avgTime: Math.round(avgRenderTime),
        slowest: renders.length > 0
          ? renders.reduce((max, r) => r.duration > max.duration ? r : max)
          : null,
      },
      memory: latestMemory ? {
        usedMB: (latestMemory.usedJSHeapSize / 1024 / 1024).toFixed(1),
        totalMB: (latestMemory.totalJSHeapSize / 1024 / 1024).toFixed(1),
        limitMB: (latestMemory.jsHeapSizeLimit / 1024 / 1024).toFixed(1),
        usage: ((latestMemory.usedJSHeapSize / latestMemory.jsHeapSizeLimit) * 100).toFixed(1) + '%',
      } : null,
      errors: {
        total: this._metrics.errors.length,
        recent: this._metrics.errors.slice(-5),
      },
    };
  }

  /** Get all raw metrics */
  getRawMetrics() {
    return { ...this._metrics };
  }

  /** Clear all metrics */
  clear() {
    this._metrics.apiCalls = [];
    this._metrics.renderTimes = [];
    this._metrics.memorySnapshots = [];
    this._metrics.errors = [];
  }

  /** Helper: wrap an async function to auto-track its duration */
  wrapApiCall(label, fn) {
    return async (...args) => {
      const start = performance.now();
      try {
        const result = await fn(...args);
        this.trackApiCall(label, performance.now() - start, true);
        return result;
      } catch (err) {
        this.trackApiCall(label, performance.now() - start, false);
        this.trackError(err.message, label);
        throw err;
      }
    };
  }

  _trim(key) {
    if (this._metrics[key].length > this._maxEntries) {
      this._metrics[key] = this._metrics[key].slice(-this._maxEntries);
    }
  }
}

// Singleton
export const perfMonitor = new PerformanceMonitor();
export default PerformanceMonitor;
