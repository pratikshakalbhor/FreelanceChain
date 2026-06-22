/**
 * FreelanceChain — Paginator Utility
 * 
 * Cursor-based and offset-based pagination for:
 * - On-chain jobs (from escrow contract)
 * - Horizon transaction history
 * - Firebase activity/notification lists
 * 
 * Features:
 * - Lazy loading with configurable page sizes
 * - Infinite scroll support (loadMore)
 * - Total count tracking
 * - Loading states per-page
 */

/**
 * Creates a paginator for any async data source.
 * @param {Object} config
 * @param {Function} config.fetchPage  — (page, pageSize) => Promise<{ items, total, hasMore }>
 * @param {number}   config.pageSize   — Items per page (default: 10)
 */
export const createPaginator = ({ fetchPage, pageSize = 10 }) => {
  let currentPage = 0;
  let allItems = [];
  let total = null;
  let hasMore = true;
  let loading = false;

  return {
    /** Load next page. Returns { items (all so far), hasMore, total } */
    async loadMore() {
      if (loading || !hasMore) return { items: allItems, hasMore, total };

      loading = true;
      try {
        const result = await fetchPage(currentPage + 1, pageSize);
        allItems = [...allItems, ...result.items];
        total = result.total ?? allItems.length;
        hasMore = result.hasMore ?? (result.items.length === pageSize);
        currentPage++;
        return { items: allItems, hasMore, total, page: currentPage };
      } finally {
        loading = false;
      }
    },

    /** Reset pagination (e.g., on filter change) */
    reset() {
      currentPage = 0;
      allItems = [];
      total = null;
      hasMore = true;
      loading = false;
    },

    /** Get current state */
    getState() {
      return {
        items: allItems,
        page: currentPage,
        pageSize,
        total,
        hasMore,
        loading,
      };
    },

    get isLoading() { return loading; },
  };
};

/**
 * Paginates an array of jobs fetched from the escrow contract.
 * Supports server-side "simulation" of pagination by fetching 
 * job IDs in ranges.
 */
export const createJobPaginator = (fetchJobById, totalJobs) => {
  const PAGE_SIZE = 10;
  let loadedJobs = [];
  let currentOffset = 0;

  return {
    async loadNextPage() {
      if (currentOffset >= totalJobs) {
        return { items: loadedJobs, hasMore: false, total: totalJobs };
      }

      const endId = Math.min(currentOffset + PAGE_SIZE, totalJobs);
      const idsToFetch = [];
      for (let i = currentOffset + 1; i <= endId; i++) {
        idsToFetch.push(i);
      }

      const newJobs = await Promise.all(
        idsToFetch.map(id => fetchJobById(id).catch(() => null))
      );

      const validJobs = newJobs.filter(Boolean);
      loadedJobs = [...loadedJobs, ...validJobs];
      currentOffset = endId;

      return {
        items: loadedJobs,
        hasMore: currentOffset < totalJobs,
        total: totalJobs,
        page: Math.ceil(currentOffset / PAGE_SIZE),
      };
    },

    reset() {
      loadedJobs = [];
      currentOffset = 0;
    },

    getState() {
      return {
        items: loadedJobs,
        loaded: currentOffset,
        total: totalJobs,
        hasMore: currentOffset < totalJobs,
      };
    },
  };
};

/**
 * React hook helper: Creates intersection observer based infinite scroll.
 * Returns a ref to attach to a sentinel element.
 */
export const createScrollObserver = (callback) => {
  if (typeof IntersectionObserver === 'undefined') return null;

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        callback();
      }
    },
    { rootMargin: '200px' }
  );

  return {
    observe(element) {
      if (element) observer.observe(element);
    },
    disconnect() {
      observer.disconnect();
    },
  };
};
