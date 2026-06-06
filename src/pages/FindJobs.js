import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";



const shortenAddr = (addr) => {
  if (!addr || typeof addr !== "string") return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const getStatusKey = (status) => {
  const s = Array.isArray(status) ? status[0] : status;
  if (typeof s === "number") return s;
  if (typeof s === "string") return s;
  if (typeof s === "object" && s !== null) return Object.keys(s)[0];
  return 0;
};

/**
 * FindJobs — displays all open jobs from the Stellar escrow contract.
 *
 * Props:
 *  - jobs        : array of job objects from EscrowPage
 *  - loading     : boolean — true while EscrowPage is loading
 *  - walletAddress: string — current user's wallet
 *  - onAccept    : fn(jobId) — called when user clicks "Accept Job"
 *  - onPostJob   : fn() — navigate to Post Job tab
 */
export default function FindJobs({ jobs = [], loading, walletAddress, onAccept, onPostJob }) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("all");

  // Only open jobs
  const openJobs = jobs.filter((j) => {
    const sk = getStatusKey(j.status);
    return sk === 0 || sk === "Open";
  });

  // Apply search + budget filters
  const filteredJobs = openJobs.filter((j) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      j.title?.toLowerCase().includes(q) ||
      j.description?.toLowerCase().includes(q);

    const xlm = Number(j.amount) / 10_000_000;
    const matchesBudget =
      budgetFilter === "all" ||
      (budgetFilter === "low" && xlm <= 50) ||
      (budgetFilter === "mid" && xlm > 50 && xlm <= 200) ||
      (budgetFilter === "high" && xlm > 200);

    return matchesSearch && matchesBudget;
  });

  // Styles
  const cardStyle = {
    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)",
    border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "12px",
    boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.2)" : "0 4px 24px rgba(0,0,0,0.08)",
    transition: "all 0.25s ease",
  };

  const inputStyle = {
    padding: "10px 16px",
    borderRadius: "10px",
    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
    color: isDark ? "#fff" : "#1a1a2e",
    fontSize: "0.9rem",
    outline: "none",
  };

  const btnStyle = (active) => ({
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.8rem",
    transition: "all 0.2s",
    background: active
      ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
      : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    color: active ? "#fff" : isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
  });

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <h2 style={{ color: isDark ? "#fff" : "#1a1a2e", margin: 0 }}>
          Open Jobs
          <span style={{ marginLeft: "8px", fontSize: "0.85rem", background: "rgba(99,102,241,0.15)", color: "#6366f1", padding: "2px 8px", borderRadius: "10px" }}>
            {filteredJobs.length}
          </span>
        </h2>
      </div>

      {/* ── Search Bar ─────────────────────────────────────── */}
      <div style={{ position: "relative", marginBottom: "12px" }}>
        <input
          type="text"
          placeholder="Search by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ ...inputStyle, width: "100%", paddingLeft: "44px", paddingRight: searchQuery ? "72px" : "16px", boxSizing: "border-box" }}
          onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
          onBlur={(e) => (e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)")}
        />
        <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", opacity: 0.6 }}>🔍</span>
        {searchQuery && (
          <>
            <span style={{ position: "absolute", right: "36px", top: "50%", transform: "translateY(-50%)", background: "#7c3aed", color: "#fff", padding: "2px 7px", borderRadius: "8px", fontSize: "0.68rem", fontWeight: 700 }}>
              {filteredJobs.length}
            </span>
            <button onClick={() => setSearchQuery("")}
              style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", cursor: "pointer", fontSize: "15px" }}>
              ✕
            </button>
          </>
        )}
      </div>

      {/* ── Budget Filter ──────────────────────────────────── */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[
          { key: "all", label: "All Budgets" },
          { key: "low", label: "≤ 50 XLM" },
          { key: "mid", label: "51–200 XLM" },
          { key: "high", label: "> 200 XLM" },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setBudgetFilter(key)} style={btnStyle(budgetFilter === key)}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
          <div style={{ width: "36px", height: "36px", border: "3px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          Loading jobs from blockchain...
        </div>
      ) : filteredJobs.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "12px" }}>💼</div>
          <h3 style={{ color: isDark ? "#fff" : "#1a1a2e" }}>
            {searchQuery || budgetFilter !== "all" ? "No matching jobs" : "No open jobs yet"}
          </h3>
          <p style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
            {searchQuery || budgetFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Be the first to post a job!"}
          </p>
          <button
            onClick={() => { setSearchQuery(""); setBudgetFilter("all"); onPostJob?.(); }}
            style={{ marginTop: "12px", padding: "10px 24px", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
            Post a Job
          </button>
        </motion.div>
      ) : (
        filteredJobs.map((job, i) => {
          const xlm = (Number(job.amount) / 10_000_000).toFixed(2);
          const isOwner = String(job.client) === walletAddress;

          return (
            <motion.div key={job.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.25 }}
              style={cardStyle}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 30px rgba(99,102,241,0.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = isDark ? "0 10px 30px rgba(0,0,0,0.2)" : "0 4px 24px rgba(0,0,0,0.08)"; }}>

              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                {/* Left — info */}
                <div style={{ flex: 1, minWidth: "220px" }}>
                  <h3 style={{ color: isDark ? "#fff" : "#1a1a2e", fontWeight: 700, margin: "0 0 6px" }}>
                    {job.title}
                  </h3>
                  <p style={{ color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)", fontSize: "0.85rem", lineHeight: 1.5, margin: "0 0 10px" }}>
                    {job.description?.length > 120 ? `${job.description.slice(0, 120)}...` : job.description}
                  </p>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "0.72rem", color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)", fontFamily: "'JetBrains Mono', monospace" }}>
                    <span>Client: {shortenAddr(String(job.client))}</span>
                    <span>Job #{job.id}</span>
                  </div>
                </div>

                {/* Right — budget + actions */}
                <div style={{ textAlign: "right", minWidth: "110px" }}>
                  <div style={{ color: "#34d399", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "1.15rem", marginBottom: "12px" }}>
                    {xlm} XLM
                  </div>
                  {isOwner ? (
                    <span style={{ fontSize: "0.75rem", padding: "4px 12px", background: "rgba(255,255,255,0.06)", borderRadius: "8px", color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}>
                      Your job
                    </span>
                  ) : (
                    <button onClick={() => onAccept?.(job.id)}
                      style={{ width: "100%", padding: "9px", background: "linear-gradient(135deg, #059669, #047857)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 600, cursor: "pointer", marginBottom: "8px", transition: "all 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                      Accept Job
                    </button>
                  )}
                  <button
                    onClick={() => navigate("/chat", { state: { recipientAddress: String(job.client) } })}
                    style={{ width: "100%", padding: "9px", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 600, cursor: "pointer", transition: "all 0.2s", marginTop: isOwner ? "8px" : "0" }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
                    Chat
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
