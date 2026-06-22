/**
 * FreelanceChain — Connection Pool Manager
 * 
 * Manages singleton Stellar SDK server instances to prevent
 * redundant connections and memory leaks.
 * 
 * Features:
 * - Singleton Horizon & Soroban RPC servers
 * - Health checks with auto-reconnect
 * - Connection status tracking
 * - Fallback URL support for resilience
 */

import * as StellarSdk from "@stellar/stellar-sdk";
import { RPC_URL, HORIZON_URL } from "../constants";

const HEALTH_CHECK_INTERVAL = 60_000; // 60 seconds
const FALLBACK_HORIZON_URLS = [
  HORIZON_URL,
  "https://horizon-testnet.stellar.org",
];
const FALLBACK_RPC_URLS = [
  RPC_URL,
  "https://soroban-testnet.stellar.org",
];

class ConnectionPool {
  constructor() {
    this._horizonServer = null;
    this._sorobanServer = null;
    this._status = {
      horizon: 'disconnected',
      soroban: 'disconnected',
      lastHealthCheck: null,
      horizonUrl: HORIZON_URL,
      sorobanUrl: RPC_URL,
    };
    this._healthCheckTimer = null;
  }

  /** Get or create Horizon server (singleton) */
  getHorizon() {
    if (!this._horizonServer) {
      this._horizonServer = new StellarSdk.Horizon.Server(this._status.horizonUrl);
      this._status.horizon = 'connected';
    }
    return this._horizonServer;
  }

  /** Get or create Soroban RPC server (singleton) */
  getSoroban() {
    if (!this._sorobanServer) {
      this._sorobanServer = new StellarSdk.rpc.Server(this._status.sorobanUrl);
      this._status.soroban = 'connected';
    }
    return this._sorobanServer;
  }

  /** Run health check on both connections */
  async healthCheck() {
    const results = { horizon: false, soroban: false };

    // Check Horizon
    try {
      const horizon = this.getHorizon();
      await horizon.ledgers().limit(1).order("desc").call();
      this._status.horizon = 'healthy';
      results.horizon = true;
    } catch (err) {
      console.warn("[ConnectionPool] Horizon health check failed:", err.message);
      this._status.horizon = 'unhealthy';
      // Try fallback
      await this._tryFallbackHorizon();
    }

    // Check Soroban
    try {
      const soroban = this.getSoroban();
      await soroban.getHealth();
      this._status.soroban = 'healthy';
      results.soroban = true;
    } catch (err) {
      console.warn("[ConnectionPool] Soroban health check failed:", err.message);
      this._status.soroban = 'unhealthy';
      await this._tryFallbackSoroban();
    }

    this._status.lastHealthCheck = Date.now();
    return results;
  }

  /** Start periodic health checks */
  startMonitoring() {
    if (this._healthCheckTimer) return;
    this._healthCheckTimer = setInterval(() => {
      this.healthCheck().catch(console.error);
    }, HEALTH_CHECK_INTERVAL);

    // Initial check
    this.healthCheck().catch(console.error);
  }

  /** Stop monitoring */
  stopMonitoring() {
    if (this._healthCheckTimer) {
      clearInterval(this._healthCheckTimer);
      this._healthCheckTimer = null;
    }
  }

  /** Get connection status */
  getStatus() {
    return { ...this._status };
  }

  /** Force reconnect */
  reconnect() {
    this._horizonServer = null;
    this._sorobanServer = null;
    this._status.horizon = 'disconnected';
    this._status.soroban = 'disconnected';
    // Re-create on next access
  }

  // ── Private ────────────────────────────────────────────────────────────────

  async _tryFallbackHorizon() {
    for (const url of FALLBACK_HORIZON_URLS) {
      if (url === this._status.horizonUrl) continue;
      try {
        const testServer = new StellarSdk.Horizon.Server(url);
        await testServer.ledgers().limit(1).order("desc").call();
        this._horizonServer = testServer;
        this._status.horizonUrl = url;
        this._status.horizon = 'healthy (fallback)';
        console.log(`[ConnectionPool] Switched to fallback Horizon: ${url}`);
        return;
      } catch { /* try next */ }
    }
  }

  async _tryFallbackSoroban() {
    for (const url of FALLBACK_RPC_URLS) {
      if (url === this._status.sorobanUrl) continue;
      try {
        const testServer = new StellarSdk.rpc.Server(url);
        await testServer.getHealth();
        this._sorobanServer = testServer;
        this._status.sorobanUrl = url;
        this._status.soroban = 'healthy (fallback)';
        console.log(`[ConnectionPool] Switched to fallback Soroban: ${url}`);
        return;
      } catch { /* try next */ }
    }
  }
}

// Singleton instance
export const connectionPool = new ConnectionPool();
export default ConnectionPool;
