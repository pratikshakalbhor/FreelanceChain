import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ref, onValue } from "firebase/database";
import { rtdb } from "../firebase";
import { useTheme } from "../context/ThemeContext";
import { useScalability } from "../context/ScalabilityContext";
import { containerVariants, itemVariants } from "../components/ProfilePage";
import * as StellarSdk from "@stellar/stellar-sdk";
import { HORIZON_URL, ESCROW_CONTRACT_ID, NETWORK_PASSPHRASE } from "../constants";
import IndexerStatus from "../components/IndexerStatus";
import { Zap, Database, Activity, Cpu, ShieldAlert } from "lucide-react";

const REFRESH_INTERVAL = 30000; // 30 seconds

export default function MonitoringPage({ walletAddress }) {
  const { isDark } = useTheme();
  const { getScalabilityReport, perfMonitor } = useScalability();

  // ── State ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [totalJobs, setTotalJobs] = useState(0);
  const [recentTxs, setRecentTxs] = useState([]);
  const [xlmBalance, setXlmBalance] = useState("0");
  const [totalChats, setTotalChats] = useState(0);
  const [totalNotifications, setTotalNotifications] = useState(0);

  // Scalability Metrics
  const [report, setReport] = useState(getScalabilityReport());

  // ── Fetch Stellar data ────────────────────────────────────────────────────
  const fetchStellarData = async () => {
    if (!walletAddress) return;
    const start = performance.now();
    try {
      const horizonServer = new StellarSdk.Horizon.Server(HORIZON_URL);
      
      // Fetch in parallel
      const [account, txRes, totalSim] = await Promise.all([
        horizonServer.loadAccount(walletAddress).catch(() => null),
        horizonServer.transactions().forAccount(walletAddress).order("desc").limit(5).call().catch(() => null),
        (async () => {
           const dummy = new StellarSdk.Account(walletAddress, "0");
           const jobTx = new StellarSdk.TransactionBuilder(dummy, {
             fee: "100", networkPassphrase: NETWORK_PASSPHRASE,
           })
             .addOperation(StellarSdk.Operation.invokeContractFunction({
               contract: ESCROW_CONTRACT_ID,
               function: "get_total",
               args: [],
             }))
             .setTimeout(30).build();
           // Use the real server for monitoring
           const server = new StellarSdk.rpc.Server("https://soroban-testnet.stellar.org");
           return server.simulateTransaction(jobTx).catch(() => null);
        })()
      ]);

      if (account) {
        const xlm = account.balances.find(b => b.asset_type === "native");
        if (xlm) setXlmBalance(parseFloat(xlm.balance).toFixed(2));
      }
      if (txRes) setRecentTxs(txRes.records || []);
      if (totalSim?.result?.retval) {
        setTotalJobs(Number(StellarSdk.scValToNative(totalSim.result.retval)));
      }

      perfMonitor.trackApiCall("MonitoringFetch", performance.now() - start, true);
    } catch (e) {
      console.error("Monitoring fetch error:", e);
      perfMonitor.trackApiCall("MonitoringFetch", performance.now() - start, false);
    }
  };

  // ── Update Scalability Report ──────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setReport(getScalabilityReport());
    }, 2000); // Fast updates for queue/perf
    return () => clearInterval(interval);
  }, [getScalabilityReport]);

  // ── Firebase listeners ────────────────────────────────────────────────────
  useEffect(() => {
    const chatRef = ref(rtdb, "chats");
    const unsubChat = onValue(chatRef, (snap) => {
      const data = snap.val() || {};
      setTotalChats(Object.keys(data).length);
    });

    const notifRef = ref(rtdb, "notifications");
    const unsubNotif = onValue(notifRef, (snap) => {
      const data = snap.val() || {};
      let count = 0;
      Object.values(data).forEach(userNotifs => {
        count += Object.keys(userNotifs).length;
      });
      setTotalNotifications(count);
    });

    return () => { unsubChat(); unsubNotif(); };
  }, []);

  // ── Initial load + auto refresh ───────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchStellarData();
      setLoading(false);
      setLastRefresh(new Date());
    };
    load();
    const interval = setInterval(async () => {
      await fetchStellarData();
      setLastRefresh(new Date());
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [walletAddress]); // eslint-disable-line

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatTime = (date) => date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const MetricCard = ({ label, value, sub, color = "#6366f1", icon: Icon }) => (
    <motion.div variants={itemVariants} style={{
      background: isDark ? "rgba(255,255,255,0.04)" : "#fff",
      border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
      borderRadius: "20px", padding: "24px",
      display: "flex", flexDirection: "column", gap: "10px",
      position: "relative", overflow: "hidden",
    }}>
      {Icon && <div style={{ position: "absolute", right: "-10px", top: "-10px", opacity: 0.05 }}><Icon size={100} /></div>}
      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", textTransform: "uppercase", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "6px" }}>
        {Icon && <Icon size={14} color={color} />}
        {label}
      </div>
      <div style={{ fontSize: "2rem", fontWeight: 800, color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {loading ? "..." : value}
      </div>
      {sub && <div style={{ fontSize: "0.75rem", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", fontWeight: 500 }}>{sub}</div>}
    </motion.div>
  );

  const HealthBadge = ({ label, status, url }) => {
    const isHealthy = status?.includes('healthy');
    const isError = status?.includes('degraded') || status?.includes('unhealthy');
    return (
      <div style={{ 
        padding: "12px 16px", 
        background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", 
        borderRadius: "14px", 
        border: `1px solid ${isHealthy ? 'rgba(16,185,129,0.2)' : isError ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)'}`,
        display: "flex", alignItems: "center", gap: "12px", minWidth: "220px"
      }}>
        <div style={{ 
          width: "10px", height: "10px", borderRadius: "50%", 
          background: isHealthy ? "#10b981" : isError ? "#ef4444" : "#64748b",
          boxShadow: isHealthy ? "0 0 10px #10b981" : "none"
        }} />
        <div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: isDark ? "#fff" : "#1a1a2e" }}>{label}</div>
          <div style={{ fontSize: "0.7rem", color: isHealthy ? "#10b981" : isError ? "#ef4444" : "#64748b", fontFamily: "monospace" }}>
            {status || 'checking...'}
          </div>
        </div>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", padding: "2rem 1.5rem" }}>
      <motion.div style={{ maxWidth: "1200px", margin: "0 auto" }} variants={containerVariants} initial="hidden" animate="visible">

        {/* Header */}
        <motion.div variants={itemVariants} style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <h1 style={{ fontSize: "clamp(1.8rem, 5vw, 2.8rem)", fontWeight: 900, color: isDark ? "#fff" : "#0f172a", margin: 0, letterSpacing: "-1px" }}>
              Engine Monitoring
            </h1>
            <p style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", marginTop: "6px", fontSize: "1rem", fontWeight: 500 }}>
              Real-time scalability & performance telemetry
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.75rem", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", fontWeight: 600 }}>
                LAST HEARTBEAT: {formatTime(lastRefresh)}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                <span style={{ width: "6px", height: "6px", background: "#10b981", borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
                LIVE UPDATES ACTIVE
              </div>
            </div>
            <button onClick={async () => { setLoading(true); await fetchStellarData(); setLoading(false); setLastRefresh(new Date()); }}
              style={{ padding: "10px 20px", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", border: "none", borderRadius: "12px", color: "#fff", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700, boxShadow: "0 4px 15px rgba(124,58,237,0.3)" }}>
              Refresh Engine
            </button>
          </div>
        </motion.div>

        {/* Scalability Engine Health */}
        <motion.div variants={itemVariants} style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 800, color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "1px" }}>Connection Protocol Status</h2>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
             <HealthBadge label="Soroban RPC Cluster" status={report.connections.soroban} />
             <HealthBadge label="Horizon API Gateway" status={report.connections.horizon} />
             <HealthBadge label="Firebase Realtime DB" status="healthy" />
          </div>
        </motion.div>

        {/* Core Marketplace & Blockchain Metrics */}
        <motion.div variants={itemVariants} style={{ marginBottom: "12px" }}>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 800, color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "1px" }}>Network & Marketplace Overview</h2>
        </motion.div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px", marginBottom: "40px" }}>
          <MetricCard label="Total Jobs Cached" value={totalJobs} sub="On-chain contract" color="#6366f1" />
          <MetricCard label="Wallet Balance" value={`${xlmBalance} XLM`} sub="Connected address" color="#10b981" />
          <MetricCard label="Active Chats" value={totalChats} sub="Firebase RTDB" color="#a78bfa" />
          <MetricCard label="Notifications" value={totalNotifications} sub="Sent alerts" color="#38bdf8" />
        </div>

        {/* Performance & Scalability Metrics */}
        <motion.div variants={itemVariants} style={{ marginBottom: "12px" }}>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 800, color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", margin: "0 0 16px", textTransform: "uppercase", letterSpacing: "1px" }}>Scalability Telemetry</h2>
        </motion.div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px", marginBottom: "40px" }}>
          <MetricCard label="Avg API Latency" value={`${report.performance.avgLatency}ms`} sub={`${report.performance.successRate} success rate`} color="#8b5cf6" icon={Zap} />
          <MetricCard label="Cache Efficiency" value={report.cache.hitRate} sub={`${report.cache.memorySize} items in L1 Memory`} color="#10b981" icon={Database} />
          <MetricCard label="Request Queue" value={report.sorobanQueue.pending + report.horizonQueue.pending} sub={`${report.sorobanQueue.active + report.horizonQueue.active} active requests`} color="#f59e0b" icon={Activity} />
          <MetricCard label="Memory Load" value={report.performance.memory ? `${report.performance.memory.usage}` : "N/A"} sub={report.performance.memory ? `${report.performance.memory.usedMB}MB used` : "No API support"} color="#3b82f6" icon={Cpu} />
        </div>

        {/* Recent On-chain Activity */}
        {recentTxs.length > 0 && (
          <motion.div variants={itemVariants} style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#fff", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)", borderRadius: "20px", padding: "24px", marginBottom: "40px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: isDark ? "#fff" : "#1a1a2e", marginBottom: "20px" }}>Recent Node Transactions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recentTxs.map((tx, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc", borderRadius: "12px", border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid #e2e8f0" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontFamily: "monospace", color: isDark ? "#a78bfa" : "#6366f1", fontWeight: 700 }}>
                      {tx.hash?.slice(0, 8)}...{tx.hash?.slice(-8)}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", marginTop: "2px" }}>
                      {new Date(tx.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontSize: "0.7rem", padding: "3px 10px", borderRadius: "8px", background: tx.successful ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: tx.successful ? "#10b981" : "#f87171", fontWeight: 700 }}>
                      {tx.successful ? "SUCCESS" : "FAILED"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Detailed Scalability Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "24px", marginBottom: "40px" }}>
          
          {/* Request Logic */}
          <motion.div variants={itemVariants} style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#fff", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)", borderRadius: "20px", padding: "24px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: isDark ? "#fff" : "#1a1a2e", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <Activity size={20} color="#f59e0b" /> Request Scheduler
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
               {[
                 { name: "Soroban (Stricter)", stats: report.sorobanQueue, color: "#8b5cf6" },
                 { name: "Horizon (Lenient)", stats: report.horizonQueue, color: "#3b82f6" }
               ].map(q => (
                 <div key={q.name} style={{ padding: "16px", background: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc", borderRadius: "14px" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "12px", color: q.color }}>{q.name} Queue</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                       <div>
                         <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Queued</div>
                         <div style={{ fontSize: "1.1rem", fontWeight: 800 }}>{q.stats.queued}</div>
                       </div>
                       <div>
                         <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Deduplicated</div>
                         <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#10b981" }}>{q.stats.deduplicated}</div>
                       </div>
                       <div>
                         <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Completed</div>
                         <div style={{ fontSize: "1.1rem", fontWeight: 800 }}>{q.stats.completed}</div>
                       </div>
                       <div>
                         <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Failed</div>
                         <div style={{ fontSize: "1.1rem", fontWeight: 800, color: q.stats.failed > 0 ? "#ef4444" : "inherit" }}>{q.stats.failed}</div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </motion.div>

          {/* Performance Log */}
          <motion.div variants={itemVariants} style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#fff", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)", borderRadius: "20px", padding: "24px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: isDark ? "#fff" : "#1a1a2e", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <ShieldAlert size={20} color="#ef4444" /> System Anomalies
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto" }}>
               {report.performance.errors.recent.length === 0 ? (
                 <div style={{ padding: "40px 20px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.85rem" }}>
                    No anomalies detected in the current session.
                 </div>
               ) : (
                 report.performance.errors.recent.map((err, i) => (
                   <div key={i} style={{ padding: "12px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.1)", borderRadius: "10px" }}>
                      <div style={{ fontSize: "0.7rem", color: "#f87171", fontWeight: 700, textTransform: "uppercase" }}>{err.source}</div>
                      <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>{err.message}</div>
                      <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", marginTop: "6px" }}>{new Date(err.timestamp).toLocaleTimeString()}</div>
                   </div>
                 ))
               )}
            </div>
          </motion.div>
        </div>

        {/* Indexer Status */}
        <div style={{ marginBottom: "32px" }}>
          <IndexerStatus walletAddress={walletAddress} />
        </div>

        {/* Footer */}
        <motion.div variants={itemVariants} style={{ textAlign: "center", padding: "40px 0", color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)", fontSize: "0.8rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontWeight: 700, marginBottom: "4px" }}>FreelanceChain Scalability Engine v2.0</div>
          <div>Stellar Testnet • Intelligent Request Queue • Multi-Layer Cache • Latency Tracking</div>
        </motion.div>

      </motion.div>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}