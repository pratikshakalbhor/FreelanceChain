import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import * as StellarSdk from "@stellar/stellar-sdk";
import { HORIZON_URL, ESCROW_CONTRACT_ID, SOROBAN_SERVER, NETWORK_PASSPHRASE } from "../constants";
import { useTheme } from "../context/ThemeContext";
import { Wallet, Briefcase, CheckCircle, Send, Plus, Zap, Search, SlidersHorizontal } from "lucide-react";
import { CategoriesRow, PopularServices } from "../components/LandingSections";

const shortenAddr = (addr) => {
  if (!addr || typeof addr !== "string") return "";
  return `${addr.slice(0, 6)}...${addr.slice(-5)}`;
};

// ── Detect transaction type from operations ───────────────────────────────────
const getTxType = (tx) => {
  try {
    const envelope = StellarSdk.TransactionBuilder.fromXDR(
      tx.envelope_xdr, "Test SDF Network ; September 2015"
    );
    const op = envelope.operations?.[0];
    if (!op) return { icon: <Zap size={18} />, label: "Transaction", color: "rgba(99,102,241,0.15)", text: "#a78bfa" };
    if (op.type === "invokeHostFunction") {
      const xdr = op.func?.toXDR?.("base64") || "";
      if (xdr.includes(ESCROW_CONTRACT_ID.slice(0, 8))) {
        return { icon: <Briefcase size={18} />, label: "Job TX", color: "rgba(16,185,129,0.15)", text: "#34d399" };
      }
      return { icon: <Zap size={18} />, label: "Contract Call", color: "rgba(139,92,246,0.15)", text: "#a78bfa" };
    }
    if (op.type === "payment") {
      return { icon: <Send size={18} />, label: "Payment", color: "rgba(245,158,11,0.15)", text: "#fbbf24" };
    }
    if (op.type === "createAccount") {
      return { icon: <Plus size={18} />, label: "Account Created", color: "rgba(59,130,246,0.15)", text: "#60a5fa" };
    }
  } catch { }
  return { icon: <Zap size={18} />, label: "Transaction", color: "rgba(99,102,241,0.15)", text: "#a78bfa" };
};

export default function DashboardPage({ walletAddress, balance }) {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [recentTxs, setRecentTxs] = useState([]);
  const [txLoading, setTxLoading] = useState(true);
  const [jobsPosted, setJobsPosted] = useState(0);
  const [jobsDone, setJobsDone] = useState(0);
  const [xlmEarned, setXlmEarned] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Load jobs from escrow contract ─────────────────────────────────────────
  useEffect(() => {
    if (!walletAddress) return;
    const loadJobs = async () => {
      try {
        const dummy = new StellarSdk.Account(walletAddress, "0");
        const totalTx = new StellarSdk.TransactionBuilder(dummy, { fee: "100", networkPassphrase: NETWORK_PASSPHRASE })
          .addOperation(StellarSdk.Operation.invokeContractFunction({ contract: ESCROW_CONTRACT_ID, function: "get_total", args: [] }))
          .setTimeout(30).build();
        const totalSim = await SOROBAN_SERVER.simulateTransaction(totalTx);
        if (!totalSim?.result?.retval) return;
        const total = Number(StellarSdk.scValToNative(totalSim.result.retval));
        let posted = 0, done = 0, earned = 0;
        for (let id = 1; id <= total; id++) {
          try {
            const jobTx = new StellarSdk.TransactionBuilder(dummy, { fee: "100", networkPassphrase: NETWORK_PASSPHRASE })
              .addOperation(StellarSdk.Operation.invokeContractFunction({
                contract: ESCROW_CONTRACT_ID, function: "get_job",
                args: [StellarSdk.nativeToScVal(id, { type: "u32" })],
              }))
              .setTimeout(30).build();
            const sim = await SOROBAN_SERVER.simulateTransaction(jobTx);
            if (sim?.result?.retval) {
              const job = StellarSdk.scValToNative(sim.result.retval);
              const sk = typeof job.status === "object" ? Object.keys(job.status)[0] : job.status;
              if (String(job.client) === walletAddress) posted++;
              if (sk === "Completed" || sk === 3) {
                done++;
                if (String(job.freelancer) === walletAddress) {
                  earned += Number(job.amount) / 10_000_000;
                }
              }
            }
          } catch { }
        }
        setJobsPosted(posted);
        setJobsDone(done);
        setXlmEarned(earned);
      } catch (e) {
        console.error("Dashboard jobs error:", e);
      }
    };
    loadJobs();
  }, [walletAddress]);

  // ── Load recent transactions ────────────────────────────────────────────────
  useEffect(() => {
    if (!walletAddress) return;
    const fetchTxs = async () => {
      try {
        setTxLoading(true);
        const server = new StellarSdk.Horizon.Server(HORIZON_URL);
        const { records } = await server.transactions()
          .forAccount(walletAddress).limit(5).order("desc").call();
        setRecentTxs(records.slice(0, 3));
      } catch (e) {
        console.error("Dashboard tx error:", e);
      } finally {
        setTxLoading(false);
      }
    };
    fetchTxs();
  }, [walletAddress]);

  const cardStyle = {
    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.8)",
    border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
    borderRadius: "16px", padding: "24px",
    boxShadow: isDark ? "none" : "0 4px 12px rgba(0,0,0,0.05)",
  };

  const StatCard = ({ icon, label, value, color, sub, delay, floatDelay }) => (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      style={{
        ...cardStyle,
        display: "flex", alignItems: "center", gap: "16px", flex: "1 1 200px",
        animation: `float-up 4s ease-in-out ${floatDelay} infinite`,
      }}>
      <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.5)", fontSize: "0.85rem", fontFamily: "'Inter', sans-serif", marginBottom: "4px" }}>{label}</div>
        <div style={{ color: isDark ? "#fff" : "#1a1a2e", fontSize: "1.5rem", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}>{value}</div>
        {sub && <div style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)", fontSize: "0.75rem", marginTop: "2px" }}>{sub}</div>}
      </div>
    </motion.div>
  );


  const stats = [
    { icon: <Wallet size={24} />, label: "XLM Balance", value: `${balance} XLM`, color: "rgba(124,58,237,0.25)", delay: 0.05, floatDelay: "0s" },

    { icon: <Briefcase size={24} />, label: "Jobs Posted", value: jobsPosted, color: "rgba(234,179,8,0.25)", delay: 0.1, sub: "As client", floatDelay: "1s" },
    { icon: <CheckCircle size={24} />, label: "Jobs Completed", value: jobsDone, color: "rgba(16,185,129,0.25)", delay: 0.15, sub: xlmEarned > 0 ? `+${xlmEarned.toFixed(0)} XLM earned` : undefined, floatDelay: "2s" },
  ];


  const actions = [
    { icon: <Briefcase size={24} />, label: "Post a Job", to: "/escrow" },
    { icon: <Send size={24} />, label: "Send Payment", to: "/payment" },
  ];

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return d; }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: "1200px", margin: "0 auto", padding: "8px" }}>

      {/* Discovery Header & Search Bar */}
      <div style={{ marginBottom: "48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "32px" }}>
          <div>
            <h1 style={{ color: isDark ? "#fff" : "#1a1a2e", fontSize: "2.5rem", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Discover Services</h1>
            <p style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", fontSize: "1.05rem", marginTop: "6px", fontFamily: "'Inter', sans-serif" }}>Find the best blockchain talent for your global projects.</p>
          </div>
          <div className="wallet-status" style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(99,102,241,0.12)", padding: "10px 18px", borderRadius: "14px", border: "1px solid rgba(99,102,241,0.25)" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 12px rgba(16,185,129,0.5)" }} />
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#a78bfa", fontFamily: "'JetBrains Mono', monospace" }}>{shortenAddr(walletAddress)}</span>
          </div>
        </div>

        {/* Global Search Bar (Fiverr Style) */}
        <div style={{ position: "relative", maxWidth: "850px", margin: "0 auto" }}>
          <input
            type="text"
            placeholder="What blockchain service are you looking for?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: "100%", 
              padding: "20px 24px 20px 64px", 
              borderRadius: "18px", 
              background: isDark ? "rgba(255,255,255,0.06)" : "#fff", 
              border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e2e8f0", 
              color: isDark ? "#fff" : "#1a1a2e",
              fontSize: "1.1rem",
              boxShadow: isDark ? "0 20px 50px rgba(0,0,0,0.4)" : "0 10px 30px rgba(0,0,0,0.05)",
              outline: "none",
              transition: "all 0.3s ease"
            }}
            onFocus={(e) => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
            onBlur={(e) => e.target.style.borderColor = isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0"}
          />
          <Search size={24} style={{ position: "absolute", left: "24px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
          <button style={{ 
            position: "absolute", 
            right: "14px", 
            top: "50%", 
            transform: "translateY(-50%)", 
            background: "rgba(99,102,241,0.15)", 
            padding: "10px", 
            borderRadius: "12px", 
            border: "1px solid rgba(99,102,241,0.3)",
            color: "#a78bfa",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(99,102,241,0.25)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(99,102,241,0.15)"}
          >
            <SlidersHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Categories Horizontal Scroll Row */}
      <CategoriesRow />

      {/* Popular Services Grid */}
      <PopularServices />

      {/* Personal Activity Summary Section */}
      <div style={{ margin: "72px 0 32px" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 700, margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Your Activity Summary</h2>
          <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.06)", margin: "0 24px" }} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </div>


      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ flex: "1 1 400px" }}>
          <div style={{ ...cardStyle, height: "100%" }}>
            <h2 style={{ color: isDark ? "#fff" : "#1a1a2e", fontSize: "1.2rem", fontWeight: 700, marginBottom: "20px" }}>Quick Actions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {actions.map((a) => (
                <motion.button key={a.to} whileHover={{ scale: 1.02, x: 4 }} whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(a.to)}
                  style={{ padding: "16px 20px", background: isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "14px", color: isDark ? "#fff" : "#1a1a2e", cursor: "pointer", display: "flex", alignItems: "center", gap: "16px", fontWeight: 700, fontSize: "1rem", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
                  {a.icon}
                  {a.label}
                  <span style={{ marginLeft: "auto" }}>→</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recent Transactions — with type labels */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ flex: "1 1 400px" }}>
          <div style={{ ...cardStyle, height: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ color: isDark ? "#fff" : "#1a1a2e", fontSize: "1.2rem", fontWeight: 700 }}>Recent Transactions</h2>
              <button onClick={() => navigate("/activity")}
                style={{ background: "transparent", border: isDark ? "1px solid rgba(124,58,237,0.3)" : "1px solid rgba(124,58,237,0.5)", borderRadius: "8px", color: isDark ? "#a78bfa" : "#6d28d9", padding: "6px 14px", fontSize: "0.85rem", cursor: "pointer", fontWeight: 600 }}>
                View All
              </button>
            </div>

            {txLoading ? (
              <div style={{ textAlign: "center", padding: "32px", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}> Loading...</div>
            ) : recentTxs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>No transactions yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {recentTxs.map((tx, i) => {
                  const txType = getTxType(tx);
                  return (
                    <motion.div key={tx.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.05 }}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)", borderRadius: "12px", gap: "12px", cursor: "pointer" }}
                      onClick={() => window.open(`https://stellar.expert/explorer/testnet/tx/${tx.hash}`, "_blank")}>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        {/* Type icon with color */}
                        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: txType.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                          {txType.icon}
                        </div>
                        <div>
                          {/* Type label instead of just hash */}
                          <div style={{ color: txType.text, fontSize: "0.9rem", fontWeight: 700, marginBottom: "2px" }}>
                            {txType.label}
                          </div>
                          <div style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)", fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace" }}>
                            {shortenAddr(tx.hash)}
                          </div>
                        </div>
                      </div>
                      <div style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", fontSize: "0.78rem", textAlign: "right", flexShrink: 0, minWidth: "70px", maxWidth: "90px", wordBreak: "break-word" }}>
                        {formatDate(tx.created_at)}
                        <div style={{ marginTop: "2px" }}>
                          <span style={{ background: tx.successful ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: tx.successful ? "#10b981" : "#ef4444", padding: "1px 6px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700 }}>
                            {tx.successful ? "✓" : "✗"}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}