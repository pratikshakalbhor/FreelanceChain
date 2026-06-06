import React, { useState } from "react";
import { motion } from "framer-motion";
import { useEscrow } from "../hooks/useEscrow";
import { useTheme } from "../context/ThemeContext";

export default function PostJobPage({ walletAddress, onJobPosted }) {
  const { isDark } = useTheme();
  const { loading, handlePostJob, status, statusType } = useEscrow();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const cardStyle = {
    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)",
    border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.2)" : "0 4px 24px rgba(0,0,0,0.08)",
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: "12px",
    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.12)",
    color: isDark ? "#fff" : "#1a1a2e", outline: "none", boxSizing: "border-box"
  };

  const onSubmit = async () => {
    try {
      const success = await handlePostJob(title, description, amount);
      if (success) {
        setTitle(""); setDescription(""); setAmount("");
        onJobPosted?.();
      }
    } catch (e) {}
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "8px", background: "linear-gradient(135deg, #fff, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Post a New Job</h1>
        <p style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>Create a job and lock XLM in secure escrow until completion</p>
      </div>

      {status && (
        <div style={{
          padding: "12px 16px", borderRadius: "12px", marginBottom: "20px",
          background: statusType === "error" ? "rgba(239,68,68,0.1)" : statusType === "success" ? "rgba(16,185,129,0.1)" : "rgba(99,102,241,0.1)",
          color: statusType === "error" ? "#f87171" : statusType === "success" ? "#34d399" : "#a5b4fc",
          border: `1px solid ${statusType === "error" ? "rgba(239,68,68,0.2)" : statusType === "success" ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.2)"}`
        }}>
          {status}
        </div>
      )}

      <div style={{ ...cardStyle, padding: "28px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)", fontSize: "0.85rem", marginBottom: "8px", display: "block" }}>Job Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Logo Design, Website..." disabled={loading} style={inputStyle} />
          </div>
          <div>
            <label style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)", fontSize: "0.85rem", marginBottom: "8px", display: "block" }}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the job requirements..." rows={4} disabled={loading}
              style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div>
            <label style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)", fontSize: "0.85rem", marginBottom: "8px", display: "block" }}>Amount (XLM)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="100" min="1" disabled={loading} style={inputStyle} />
          </div>
          
          <div style={{ padding: "16px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "12px", fontSize: "0.85rem", color: "#60a5fa" }}>
            <strong>Escrow Security:</strong> Funds are held by the smart contract. You only release them when you are satisfied with the work.
          </div>

          <button 
            onClick={onSubmit} 
            disabled={loading} 
            style={{
              padding: "16px",
              background: loading ? "rgba(124,58,237,0.3)" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
              border: "none", borderRadius: "14px", color: "#fff", fontWeight: 700, fontSize: "1rem",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s"
            }}
          >
            {loading ? "Processing..." : "Post Job & Lock XLM"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
