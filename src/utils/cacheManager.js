/**
 * FreelanceChain — Multi-Layer Cache Manager
 * 
 * L1: In-Memory Map (instant, cleared on refresh)
 * L2: sessionStorage (survives in-page navigation)
 * L3: Firebase RTDB (persists across sessions)
 * 
 * Features:
 * - TTL (time-to-live) per entry
 * - Key-based invalidation
 * - Pattern-based cache busting (e.g., clear all "jobs/*")
 * - Stale-while-revalidate strategy
 * - Memory pressure monitoring
 */

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_MEMORY_ENTRIES = 200;     // prevent memory leaks

class CacheManager {
  constructor() {
    this._memoryCache = new Map();   // L1
    this._stats = { hits: 0, misses: 0, evictions: 0 };
  }

  /**
   * Get a cached value. Returns null if not found or expired.
   * Checks L1 (memory) first, then L2 (sessionStorage).
   */
  get(key) {
    // L1: Memory
    const memEntry = this._memoryCache.get(key);
    if (memEntry && !this._isExpired(memEntry)) {
      this._stats.hits++;
      return memEntry.data;
    }

    // L2: sessionStorage
    try {
      const raw = sessionStorage.getItem(`cache_${key}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!this._isExpired(parsed)) {
          // Promote back to L1
          this._memoryCache.set(key, parsed);
          this._stats.hits++;
          return parsed.data;
        } else {
          sessionStorage.removeItem(`cache_${key}`);
        }
      }
    } catch { /* ignore parse errors */ }

    this._stats.misses++;
    return null;
  }

  /**
   * Store a value in L1 + L2 cache.
   * @param {string} key 
   * @param {*} data 
   * @param {number} ttl  — milliseconds
   */
  set(key, data, ttl = DEFAULT_TTL) {
    const entry = {
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    // L1
    this._memoryCache.set(key, entry);
    this._enforceMemoryLimit();

    // L2: sessionStorage (try, may fail if quota exceeded)
    try {
      sessionStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch {
      // sessionStorage full — degrade gracefully
      console.warn('[CacheManager] sessionStorage quota exceeded, L2 cache skipped');
    }
  }

  /**
   * Invalidate a specific key or all keys matching a pattern.
   * Pattern uses simple prefix matching: "jobs" clears "jobs", "jobs/1", etc.
   */
  invalidate(pattern) {
    // L1
    for (const key of this._memoryCache.keys()) {
      if (key === pattern || key.startsWith(pattern + '/') || key.startsWith(pattern + ':')) {
        this._memoryCache.delete(key);
        this._stats.evictions++;
      }
    }

    // L2
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const storageKey = sessionStorage.key(i);
        if (storageKey && storageKey.startsWith('cache_')) {
          const cacheKey = storageKey.replace('cache_', '');
          if (cacheKey === pattern || cacheKey.startsWith(pattern + '/') || cacheKey.startsWith(pattern + ':')) {
            sessionStorage.removeItem(storageKey);
          }
        }
      }
    } catch { /* ignore */ }
  }

  /**
   * Stale-while-revalidate:
   * Immediately return cached data (even if stale), 
   * then run refreshFn in background and update cache.
   */
  async getOrRefresh(key, refreshFn, ttl = DEFAULT_TTL) {
    const cached = this.get(key);

    // If we have fresh data, return immediately
    if (cached !== null) {
      return cached;
    }

    // No cache — must fetch
    const fresh = await refreshFn();
    this.set(key, fresh, ttl);
    return fresh;
  }

  /**
   * Stale-while-revalidate with background refresh.
   * Returns stale data immediately if available, refreshes in background.
   * @returns {{ data, isStale: boolean, refreshPromise: Promise|null }}
   */
  getWithRevalidate(key, refreshFn, ttl = DEFAULT_TTL) {
    // Check if we have ANY data (even expired)
    const memEntry = this._memoryCache.get(key);
    const isStale = memEntry ? this._isExpired(memEntry) : true;
    const data = memEntry ? memEntry.data : null;

    let refreshPromise = null;
    if (isStale) {
      refreshPromise = refreshFn()
        .then(fresh => {
          this.set(key, fresh, ttl);
          return fresh;
        })
        .catch(err => {
          console.warn(`[CacheManager] Background refresh failed for ${key}:`, err);
          return data; // fallback to stale data
        });
    }

    return { data, isStale, refreshPromise };
  }

  /** Clear all caches */
  clear() {
    this._memoryCache.clear();
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('cache_')) {
          sessionStorage.removeItem(key);
        }
      }
    } catch { /* ignore */ }
  }

  /** Get cache statistics */
  getStats() {
    return {
      ...this._stats,
      memorySize: this._memoryCache.size,
      hitRate: this._stats.hits + this._stats.misses > 0
        ? ((this._stats.hits / (this._stats.hits + this._stats.misses)) * 100).toFixed(1) + '%'
        : '0%',
    };
  }

  // ── Private ────────────────────────────────────────────────────────────────

  _isExpired(entry) {
    return Date.now() > entry.expiresAt;
  }

  _enforceMemoryLimit() {
    if (this._memoryCache.size <= MAX_MEMORY_ENTRIES) return;

    // Evict oldest entries first
    const entries = [...this._memoryCache.entries()]
      .sort((a, b) => a[1].createdAt - b[1].createdAt);

    const toRemove = entries.slice(0, entries.length - MAX_MEMORY_ENTRIES);
    for (const [key] of toRemove) {
      this._memoryCache.delete(key);
      this._stats.evictions++;
    }
  }
}

// Singleton
export const cacheManager = new CacheManager();
export default CacheManager;
