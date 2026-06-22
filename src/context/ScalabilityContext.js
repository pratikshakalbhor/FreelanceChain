/**
 * FreelanceChain — Scalability Context
 * 
 * Central React Context that wires up all scalability utilities:
 * - Connection Pool (singleton servers)
 * - Request Queue (rate limiting + retry)
 * - Cache Manager (multi-layer caching)
 * - Performance Monitor (metrics)
 * 
 * Provides access to these via useScalability() hook.
 */

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { connectionPool } from '../utils/connectionPool';
import { sorobanQueue, horizonQueue } from '../utils/requestQueue';
import { cacheManager } from '../utils/cacheManager';
import { perfMonitor } from '../utils/performanceMonitor';

const ScalabilityContext = createContext(null);

export const useScalability = () => {
  const ctx = useContext(ScalabilityContext);
  if (!ctx) {
    // Fallback for use outside provider — return direct instances
    return {
      connectionPool,
      sorobanQueue,
      horizonQueue,
      cacheManager,
      perfMonitor,
      getScalabilityReport: () => ({}),
    };
  }
  return ctx;
};

export const ScalabilityProvider = ({ children }) => {
  // Start monitoring on mount
  useEffect(() => {
    connectionPool.startMonitoring();

    // Periodic memory snapshots
    const memoryInterval = setInterval(() => {
      perfMonitor.snapshotMemory();
    }, 30_000);

    return () => {
      connectionPool.stopMonitoring();
      clearInterval(memoryInterval);
    };
  }, []);

  const value = useMemo(() => ({
    // Connection Pool — singleton server instances
    connectionPool,

    // Request Queues — rate-limited, retry-enabled
    sorobanQueue,
    horizonQueue,

    // Cache — multi-layer with SWR
    cacheManager,

    // Performance — metrics tracking
    perfMonitor,

    /** Generate a full scalability report (for Monitoring page) */
    getScalabilityReport: () => ({
      connections: connectionPool.getStatus(),
      sorobanQueue: sorobanQueue.getStats(),
      horizonQueue: horizonQueue.getStats(),
      cache: cacheManager.getStats(),
      performance: perfMonitor.getSummary(),
      timestamp: new Date().toISOString(),
    }),
  }), []);

  return (
    <ScalabilityContext.Provider value={value}>
      {children}
    </ScalabilityContext.Provider>
  );
};

export default ScalabilityContext;
