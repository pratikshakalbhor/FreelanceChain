import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { useWallet } from "../WalletContext";
import * as StellarSdk from "@stellar/stellar-sdk";
import { motion, AnimatePresence } from "framer-motion";
import { HORIZON_URL, NETWORK_PASSPHRASE } from "../constants";
import { listenToActivities } from "../utils/activityService";
import {
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Briefcase,
  ShieldAlert,
  Award,
  Zap,
  Search,
  ExternalLink,
  ChevronRight
} from "lucide-react";

const ActivityPage = () => {
  const { isDark } = useTheme();
  const { walletAddress } = useWallet();
  const [blockchainActivities, setBlockchainActivities] = useState([]);
  const [firebaseActivities, setFirebaseActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  const timeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatAmount = (amount) => {
    return parseFloat(amount).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    });
  };

  const getExplorerLink = (hash) => `https://stellar.expert/explorer/testnet/tx/${hash}`;

  // ─── Data Fetching ────────────────────────────────────────────────────────────

  const fetchActivity = useCallback(async () => {
    if (!walletAddress) return;
    setIsRefreshing(true);

    try {
      const allActivities = [];

      // 1. Fetch Stellar Transactions (Blockchain)
      try {
        const server = new StellarSdk.Horizon.Server(HORIZON_URL);
        const txs = await server.transactions()
          .forAccount(walletAddress)
          .order("desc")
          .limit(25)
          .call();

        txs.records.forEach(tx => {
          try {
            const envelope = StellarSdk.TransactionBuilder.fromXDR(tx.envelope_xdr, NETWORK_PASSPHRASE);
            const op = envelope.operations[0];

            let title = "System Update";
            let type = "transaction";
            let color = "#94a3b8";
            let icon = <Zap size={18} />;
            let description = `Network transaction indexed`;

            if (op.type === "payment" && op.asset.isNative()) {
              const isSent = tx.source_account === walletAddress;
              type = isSent ? "payment_sent" : "payment_received";
              title = isSent ? "Payment Sent" : "Payment Received";
              description = isSent
                ? `Sent ${formatAmount(op.amount)} XLM to ${op.destination.slice(0, 4)}...${op.destination.slice(-4)}`
                : `Received ${formatAmount(op.amount)} XLM from ${tx.source_account.slice(0, 4)}...${tx.source_account.slice(-4)}`;
              color = isSent ? "#f87171" : "#10b981";
              icon = isSent ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />;
            } else if (op.type === "invokeHostFunction") {
              title = "Smart Contract Call";
              color = "#8b5cf6";
              description = "Interacted with Soroban protocol";
              if (tx.envelope_xdr.toLowerCase().includes("approve")) {
                title = "Approval Granted";
                description = "Authorized contract spending allowance";
                color = "#3b82f6";
              }
            }

            allActivities.push({
              id: tx.id,
              hash: tx.hash,
              type, title, description, time: new Date(tx.created_at), color, icon,
              source: "blockchain"
            });
          } catch (e) { /* skip */ }
        });
      } catch (e) {
        console.warn("Blockchain fetch fail:", e);
      }

      setBlockchainActivities(allActivities);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // Firebase Real-time
  useEffect(() => {
    if (!walletAddress) return;
    const unsubscribe = listenToActivities(walletAddress, (newActivities) => {
      const mapped = newActivities.map(act => ({
        id: act.id,
        type: act.type,
        title: act.title,
        description: act.description,
        time: new Date(act.timestamp),
        color: act.color || "#6366f1",
        icon: getIconForFirebaseType(act.type, act.color),
        source: "firebase"
      }));
      setFirebaseActivities(mapped);
    });
    return () => unsubscribe();
  }, [walletAddress]);

  function getIconForFirebaseType(type) {
    if (type.includes("job_")) return <Briefcase size={18} />;
    if (type.includes("payment_")) return <ArrowDownLeft size={18} />;
    if (type.includes("award") || type.includes("cert")) return <Award size={18} />;
    if (type.includes("dispute") || type.includes("security")) return <ShieldAlert size={18} />;
    return <Zap size={18} />;
  }

  const activities = useMemo(() => {
    const combined = [...firebaseActivities, ...blockchainActivities];
    return combined.sort((a, b) => b.time - a.time);
  }, [firebaseActivities, blockchainActivities]);

  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      const matchesSearch = 
        act.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        act.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;
      if (filter === "all") return true;
      if (filter === "finance") return act.type.includes("payment") || act.title.includes("Released");
      if (filter === "jobs") return act.type.includes("job_") || act.source === "firebase";
      if (filter === "blockchain") return act.source === "blockchain";
      return true;
    });
  }, [activities, filter, searchQuery]);

  // ─── Render Components ─────────────────────────────────────────────────────────

  return (
    <div style={{
      padding: "2rem 1rem",
      maxWidth: "900px",
      margin: "0 auto",
      minHeight: "100vh"
    }}>
      {/* Dynamic Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex", justifyBetween: "space-between", alignItems: "flex-end",
          marginBottom: "40px", gap: "20px", flexWrap: "wrap"
        }}
      >
        <div style={{ flex: 1 }}>
          <h1 style={{ 
            fontSize: "2.5rem", fontWeight: 800, margin: 0, 
            background: isDark ? "linear-gradient(135deg, #fff 0%, #94a3b8 100%)" : "linear-gradient(135deg, #0f172a 0%, #475569 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>
            Activity Stream
          </h1>
          <p style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.6)", fontSize: "1rem", marginTop: "4px" }}>
            Tracking your decentralized footprint across the Stellar network.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
                borderRadius: "12px", padding: "10px 12px 10px 36px", color: isDark ? "#fff" : "#000",
                width: "180px", outline: "none", fontSize: "0.85rem"
              }}
            />
          </div>
          <button
            onClick={fetchActivity}
            disabled={isRefreshing}
            style={{
              background: isDark ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.08)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              borderRadius: "12px", padding: "10px 16px",
              color: "#a78bfa", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "0.85rem"
            }}
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Syncing..." : "Sync"}
          </button>
        </div>
      </motion.div>

      {/* Modern Filter Tabs */}
      <div style={{ 
        display: "flex", gap: "10px", marginBottom: "32px", overflowX: "auto", 
        padding: "6px", background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", 
        borderRadius: "16px", width: "fit-content" 
      }}>
        {["all", "finance", "jobs", "blockchain"].map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{
              padding: "8px 18px", borderRadius: "12px", border: "none", cursor: "pointer",
              fontSize: "0.85rem", fontWeight: 700, textTransform: "capitalize", transition: "all 0.25s ease",
              background: filter === t ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "transparent",
              color: filter === t ? "#fff" : isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.5)",
              boxShadow: filter === t ? "0 4px 12px rgba(99,102,241,0.4)" : "none"
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Activity List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ 
                height: "80px", borderRadius: "20px", 
                background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                animation: "pulse 1.5s infinite"
              }} />
            ))
          ) : filteredActivities.length > 0 ? (
            filteredActivities.map((act, idx) => (
              <motion.div
                key={act.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                style={{
                  background: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.95)",
                  border: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(0, 0, 0, 0.05)",
                  borderRadius: "20px", padding: "18px 24px", display: "flex", alignItems: "center", gap: "20px",
                  boxShadow: isDark ? "none" : "0 4px 20px rgba(0,0,0,0.03)",
                  cursor: "default", position: "relative", overflow: "hidden"
                }}
              >
                {/* Visual Accent */}
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: act.color }} />

                <div style={{
                  width: "48px", height: "48px", borderRadius: "14px",
                  background: `${act.color}15`, color: act.color,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  {act.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: isDark ? "#fff" : "#1e293b" }}>{act.title}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {act.hash && (
                        <a 
                          href={getExplorerLink(act.hash)} target="_blank" rel="noreferrer"
                          style={{ color: "rgba(99,102,241,0.6)", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
                          onMouseEnter={e => e.currentTarget.style.color = "#818cf8"}
                          onMouseLeave={e => e.currentTarget.style.color = "rgba(99,102,241,0.6)"}
                        >
                          <ExternalLink size={12} /> EXPLORER
                        </a>
                      )}
                      <span style={{ fontSize: "0.75rem", color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={12} /> {timeAgo(act.time)}
                      </span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.6)", lineHeight: 1.5 }}>
                    {act.description}
                  </p>
                </div>
                <ChevronRight size={16} style={{ opacity: 0.2 }} />
              </motion.div>
            ))
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "100px 20px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "20px", opacity: 0.3 }}>🌀</div>
              <h3 style={{ color: isDark ? "#fff" : "#000" }}>No matching activity</h3>
              <p style={{ color: "rgba(128,128,128,0.5)" }}>Try adjusting your filters or search query.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ 
        marginTop: "40px", textAlign: "center", padding: "20px",
        borderTop: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)",
        color: "rgba(128,128,128,0.5)", fontSize: "0.8rem", display: "flex", justifyContent: "center", gap: "20px"
      }}>
        <span>Pulse: 30s</span>
        <span>Synced: {lastUpdated.toLocaleTimeString()}</span>
        <span>Network: Soroban Testnet</span>
      </div>

      <style>{`
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ActivityPage;
