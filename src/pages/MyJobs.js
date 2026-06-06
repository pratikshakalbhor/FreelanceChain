import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";

const STATUS_COLORS = {
  Open: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa", label: "Open" },
  InProgress: { bg: "rgba(234,179,8,0.15)", color: "#facc15", label: "In Progress" },
  Submitted: { bg: "rgba(249,115,22,0.15)", color: "#fb923c", label: "Submitted" },
  Completed: { bg: "rgba(16,185,129,0.15)", color: "#34d399", label: "Completed" },
  Cancelled: { bg: "rgba(239,68,68,0.15)", color: "#f87171", label: "Cancelled" },
  0: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa", label: "Open" },
  1: { bg: "rgba(234,179,8,0.15)", color: "#facc15", label: "In Progress" },
  2: { bg: "rgba(249,115,22,0.15)", color: "#fb923c", label: "Submitted" },
  3: { bg: "rgba(16,185,129,0.15)", color: "#34d399", label: "Completed" },
  4: { bg: "rgba(239,68,68,0.15)", color: "#f87171", label: "Cancelled" },
};

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
 * MyJobs — shows jobs posted by the user (as client) and jobs accepted (as freelancer).
 *
 * Props:
 *  - jobs          : array of all job objects from EscrowPage
 *  - loading       : boolean
 *  - walletAddress : string
 *  - onSubmitWork  : fn(jobId, workUrl) — called when freelancer submits work
 *  - onApprove     : fn(jobId) — called when client approves job
 *  - onCancel      : fn(jobId) — called when client cancels job
 *  - onFindJobs    : fn() — navigate to Find Jobs tab
 */
export default function MyJobs({ jobs = [], loading, walletAddress, onSubmitWork, onApprove, onCancel, onFindJobs }) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [subTab, setSubTab] = useState("posted");
  const [workUrls, setWorkUrls] = useState({}); // { [jobId]: url }

  // ── Split jobs ─────────────────────────────────────────
  const postedJobs = jobs.filter((j) => String(j.client) === walletAddress);
  const freelanceJobs = jobs.filter(
    (j) => String(j.freelancer) === walletAddress && String(j.freelancer) !== String(j.client)
  );

  // ── Style helpers ──────────────────────────────────────
  const cardStyle = {
    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)",
    border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "12px",
    boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.2)" : "0 4px 24px rgba(0,0,0,0.08)",
    transition: "all 0.25s ease",
  };

  const subTabStyle = (key) => ({
    flex: 1, padding: "9px 16px", borderRadius: "10px", border: "none", cursor: "pointer",
    fontWeight: 600, fontSize: "0.85rem", transition: "all 0.2s",
    background: subTab === key ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "transparent",
    color: subTab === key ? "#fff" : isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
  });

  const actionBtn = (gradient, label, onClick) => (
    <button onClick={onClick}
      style={{ padding: "9px 18px", background: gradient, border: "none", borderRadius: "10px", color: "#fff", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s" }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
      {label}
    </button>
  );

  const EmptyState = ({ icon, title, subtitle, btnLabel, onBtnClick }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: "3rem", marginBottom: "12px" }}>{icon}</div>
      <h3 style={{ color: isDark ? "#fff" : "#1a1a2e", margin: "0 0 8px" }}>{title}</h3>
      <p style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", marginBottom: "16px" }}>{subtitle}</p>
      {btnLabel && (
        <button onClick={onBtnClick}
          style={{ padding: "10px 24px", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
          {btnLabel}
        </button>
      )}
    </motion.div>
  );

  // ── Job card for POSTED jobs (client view) ─────────────
  const PostedJobCard = ({ job, i }) => {
    const statusKey = getStatusKey(job.status);
    const statusInfo = STATUS_COLORS[statusKey] || STATUS_COLORS[0];
    const xlm = (Number(job.amount) / 10_000_000).toFixed(2);
    const freelancer = String(job.freelancer);
    const hasFreelancer = freelancer && freelancer !== walletAddress && freelancer.length > 10;
    const isSubmitted = statusKey === 2 || statusKey === "Submitted";

    return (
      <motion.div key={job.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.06 }} style={cardStyle}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 30px rgba(99,102,241,0.15)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = isDark ? "0 10px 30px rgba(0,0,0,0.2)" : "0 4px 24px rgba(0,0,0,0.08)"; }}>

        {/* Title row */}
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: isDark ? "#fff" : "#1a1a2e", fontWeight: 700, margin: "0 0 4px" }}>{job.title}</h3>
            <p style={{ color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)", fontSize: "0.85rem", lineHeight: 1.5, margin: 0 }}>
              {job.description?.length > 100 ? `${job.description.slice(0, 100)}...` : job.description}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "20px", background: statusInfo.bg, color: statusInfo.color, fontSize: "0.78rem", fontWeight: 700, marginBottom: "6px" }}>
              {statusInfo.label}
            </span>
            <div style={{ color: "#34d399", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{xlm} XLM</div>
          </div>
        </div>

        {/* Meta */}
        <div style={{ fontSize: "0.72rem", color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)", fontFamily: "'JetBrains Mono', monospace", marginBottom: "12px" }}>
          Job #{job.id} • Posted by you
          {hasFreelancer && <span> • Freelancer: {shortenAddr(freelancer)}</span>}
        </div>

        {/* Submitted work preview */}
        {job.work_url && String(job.work_url) !== "" && (
          <div style={{ padding: "10px 14px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: "10px", marginBottom: "12px", fontSize: "0.82rem", color: "#a5b4fc" }}>
            📎 Work submitted:{" "}
            <a href={String(job.work_url)} target="_blank" rel="noopener noreferrer" style={{ color: "#818cf8", wordBreak: "break-all" }}>
              {String(job.work_url).length > 60 ? `${String(job.work_url).slice(0, 60)}...` : String(job.work_url)}
            </a>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {isSubmitted && actionBtn("linear-gradient(135deg, #059669, #047857)", "✅ Approve & Release XLM", () => onApprove?.(job.id))}
          {(statusKey === 0 || statusKey === "Open") && actionBtn("linear-gradient(135deg, #dc2626, #b91c1c)", "Cancel Job", () => onCancel?.(job.id))}
          {hasFreelancer && (
            <button onClick={() => navigate("/chat", { state: { recipientAddress: freelancer } })}
              style={{ padding: "9px 18px", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s" }}>
              💬 Chat
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  // ── Job card for ACCEPTED jobs (freelancer view) ───────
  const FreelanceJobCard = ({ job, i }) => {
    const statusKey = getStatusKey(job.status);
    const statusInfo = STATUS_COLORS[statusKey] || STATUS_COLORS[0];
    const xlm = (Number(job.amount) / 10_000_000).toFixed(2);
    const isInProgress = statusKey === 1 || statusKey === "InProgress";
    const isSubmitted = statusKey === 2 || statusKey === "Submitted";
    const url = workUrls[job.id] || "";

    return (
      <motion.div key={job.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.06 }} style={cardStyle}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 30px rgba(99,102,241,0.15)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = isDark ? "0 10px 30px rgba(0,0,0,0.2)" : "0 4px 24px rgba(0,0,0,0.08)"; }}>

        {/* Title row */}
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: isDark ? "#fff" : "#1a1a2e", fontWeight: 700, margin: "0 0 4px" }}>{job.title}</h3>
            <p style={{ color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)", fontSize: "0.85rem", lineHeight: 1.5, margin: 0 }}>
              {job.description?.length > 100 ? `${job.description.slice(0, 100)}...` : job.description}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "20px", background: statusInfo.bg, color: statusInfo.color, fontSize: "0.78rem", fontWeight: 700, marginBottom: "6px" }}>
              {statusInfo.label}
            </span>
            <div style={{ color: "#34d399", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{xlm} XLM</div>
          </div>
        </div>

        {/* Meta */}
        <div style={{ fontSize: "0.72rem", color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)", fontFamily: "'JetBrains Mono', monospace", marginBottom: "12px" }}>
          Job #{job.id} • Client: {shortenAddr(String(job.client))}
        </div>

        {/* Submit work area — only when InProgress */}
        {isInProgress && (
          <div style={{ marginBottom: "12px" }}>
            <label style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)", fontSize: "0.82rem", display: "block", marginBottom: "6px", fontWeight: 600 }}>
              📎 Submit Work URL or IPFS Link
            </label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <input type="text" placeholder="https://... or ipfs://..."
                value={url}
                onChange={(e) => setWorkUrls((prev) => ({ ...prev, [job.id]: e.target.value }))}
                style={{ flex: 1, minWidth: "200px", padding: "9px 14px", borderRadius: "10px", background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", color: isDark ? "#fff" : "#1a1a2e", fontSize: "0.88rem", outline: "none" }}
                onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
                onBlur={(e) => (e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)")}
              />
              {actionBtn("linear-gradient(135deg, #7c3aed, #4f46e5)", "Submit", () => {
                if (url.trim()) { onSubmitWork?.(job.id, url.trim()); }
              })}
            </div>
          </div>
        )}

        {/* Existing work URL */}
        {isSubmitted && job.work_url && (
          <div style={{ padding: "10px 14px", background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.25)", borderRadius: "10px", marginBottom: "12px", fontSize: "0.82rem", color: "#fb923c" }}>
            ⏳ Work submitted — Awaiting client approval.{" "}
            <a href={String(job.work_url)} target="_blank" rel="noopener noreferrer" style={{ color: "#a78bfa" }}>View Work</a>
          </div>
        )}

        {/* Chat with client */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => navigate("/chat", { state: { recipientAddress: String(job.client) } })}
            style={{ padding: "9px 18px", background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)", border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.1)", borderRadius: "10px", color: isDark ? "#a78bfa" : "#6d28d9", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s" }}>
            💬 Chat with Client
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
        <h2 style={{ color: isDark ? "#fff" : "#1a1a2e", margin: 0 }}>My Jobs</h2>
      </div>

      {/* ── Sub-tabs ────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "6px", background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", padding: "5px", borderRadius: "14px", border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)", marginBottom: "20px" }}>
        <button style={subTabStyle("posted")} onClick={() => setSubTab("posted")}>
          📋 Posted by Me
          <span style={{ background: subTab === "posted" ? "rgba(255,255,255,0.2)" : "rgba(99,102,241,0.2)", padding: "1px 6px", borderRadius: "8px", fontSize: "0.72rem", color: subTab === "posted" ? "#fff" : "#6366f1" }}>
            {postedJobs.length}
          </span>
        </button>
        <button style={subTabStyle("applied")} onClick={() => setSubTab("applied")}>
          🤝 Accepted Jobs
          <span style={{ background: subTab === "applied" ? "rgba(255,255,255,0.2)" : "rgba(99,102,241,0.2)", padding: "1px 6px", borderRadius: "8px", fontSize: "0.72rem", color: subTab === "applied" ? "#fff" : "#6366f1" }}>
            {freelanceJobs.length}
          </span>
        </button>
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
          <div style={{ width: "36px", height: "36px", border: "3px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          Loading jobs...
        </div>
      ) : subTab === "posted" ? (
        postedJobs.length === 0 ? (
          <EmptyState icon="📋" title="No jobs posted yet" subtitle="Post your first job and let freelancers apply!" btnLabel="Post a Job" onBtnClick={() => navigate("/escrow")} />
        ) : (
          postedJobs.map((job, i) => <PostedJobCard key={job.id} job={job} i={i} />)
        )
      ) : (
        freelanceJobs.length === 0 ? (
          <EmptyState icon="🤝" title="No accepted jobs yet" subtitle="Browse open jobs and accept one to get started." btnLabel="Find Jobs" onBtnClick={() => onFindJobs?.()} />
        ) : (
          freelanceJobs.map((job, i) => <FreelanceJobCard key={job.id} job={job} i={i} />)
        )
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
