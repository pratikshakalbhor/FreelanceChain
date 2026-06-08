import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Clock, DollarSign, CheckCircle, AlertCircle, X
} from "lucide-react";
import { db } from "../firebase";
import {
  collection, addDoc, serverTimestamp, query,
  where, getDocs
} from "firebase/firestore";

const DELIVERY_OPTIONS = [
  { label: "1–3 days", value: 2 },
  { label: "3–7 days", value: 5 },
  { label: "1–2 weeks", value: 10 },
  { label: "2–4 weeks", value: 21 },
  { label: "1+ month", value: 35 },
];

export default function ProposalModal({
  isOpen, onClose, job, walletAddress
}) {
  const [coverLetter, setCoverLetter] = useState("");
  const [bidAmount, setBidAmount] = useState(job?._xlm || "");
  const [deliveryDays, setDeliveryDays] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [checkingApplied, setCheckingApplied] = useState(false);

  // Reset on open
  useEffect(() => {
    if (isOpen && job) {
      setCoverLetter("");
      setBidAmount(job._xlm?.toFixed(0) || "");
      setDeliveryDays(5);
      setError("");
      setSuccess(false);
      setAlreadyApplied(false);
      checkExistingProposal();
    }
    // eslint-disable-next-line
  }, [isOpen, job]);

  const checkExistingProposal = async () => {
    if (!walletAddress || !job?.id) return;
    setCheckingApplied(true);
    try {
      const q = query(
        collection(db, "proposals"),
        where("jobId", "==", String(job.id)),
        where("freelancerAddress", "==", walletAddress)
      );
      const snap = await getDocs(q);
      setAlreadyApplied(!snap.empty);
    } catch (e) {
      console.warn("Could not check existing proposal:", e.message);
    } finally {
      setCheckingApplied(false);
    }
  };

  const validate = () => {
    if (!coverLetter.trim() || coverLetter.trim().length < 30) {
      setError("Cover letter must be at least 30 characters.");
      return false;
    }
    const bid = parseFloat(bidAmount);
    if (!bid || bid <= 0) {
      setError("Please enter a valid bid amount.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "proposals"), {
        jobId: String(job.id),
        jobTitle: job.title,
        clientAddress: String(job.client),
        freelancerAddress: walletAddress,
        coverLetter: coverLetter.trim(),
        bidAmount: parseFloat(bidAmount),
        originalBudget: job._xlm,
        deliveryDays,
        status: "pending",   // pending | accepted | rejected
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2200);
    } catch (e) {
      console.error("Proposal submit error:", e);
      setError("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !job) return null;

  const charCount = coverLetter.trim().length;
  const isReady = charCount >= 30 && parseFloat(bidAmount) > 0 && !loading && !alreadyApplied;

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(8,13,26,0.85)",
        backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1100, padding: "20px",
      }}
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ type: "spring", damping: 22, stiffness: 280 }}
        style={{
          background: "linear-gradient(145deg, #0f172a, #111827)",
          border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: "24px",
          width: "100%", maxWidth: "560px",
          padding: "32px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "14px",
              background: "rgba(99,102,241,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#818cf8",
            }}>
              <FileText size={24} />
            </div>
            <div>
              <h2 style={{ color: "#fff", margin: 0, fontSize: "1.3rem", fontWeight: 800 }}>
                Submit Proposal
              </h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem", margin: "4px 0 0" }}>
                {job.title} • Budget: {job._xlm?.toFixed(0)} XLM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: "4px" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Success State */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: "center", padding: "40px 20px" }}
            >
              <div style={{
                width: "72px", height: "72px", borderRadius: "50%",
                background: "rgba(16,185,129,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <CheckCircle size={40} color="#10b981" />
              </div>
              <h3 style={{ color: "#fff", margin: "0 0 8px", fontSize: "1.2rem" }}>Proposal Sent! 🎉</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", margin: 0 }}>
                The client will review your proposal and get back to you.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {!success && (
          <>
            {/* Already Applied */}
            {checkingApplied && (
              <div style={{ textAlign: "center", padding: "20px", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
                Checking existing applications...
              </div>
            )}

            {alreadyApplied && !checkingApplied && (
              <div style={{
                padding: "16px", background: "rgba(234,179,8,0.1)",
                border: "1px solid rgba(234,179,8,0.3)", borderRadius: "12px",
                color: "#fbbf24", fontSize: "0.85rem",
                display: "flex", alignItems: "center", gap: "10px",
                marginBottom: "20px",
              }}>
                <AlertCircle size={18} />
                You have already submitted a proposal for this job.
              </div>
            )}

            {!alreadyApplied && !checkingApplied && (
              <>
                {/* Bid Amount */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    color: "rgba(255,255,255,0.7)", fontSize: "0.85rem",
                    fontWeight: 600, marginBottom: "10px"
                  }}>
                    <DollarSign size={14} color="#34d399" />
                    Your Bid (XLM)
                    <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400, fontSize: "0.75rem" }}>
                      (Client budget: {job._xlm?.toFixed(0)} XLM)
                    </span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bidAmount}
                    onChange={(e) => { setBidAmount(e.target.value); setError(""); }}
                    placeholder="e.g. 250"
                    style={{
                      width: "100%", padding: "13px 16px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px", color: "#fff",
                      fontSize: "1rem", fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700, outline: "none", boxSizing: "border-box",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>

                {/* Delivery Time */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    color: "rgba(255,255,255,0.7)", fontSize: "0.85rem",
                    fontWeight: 600, marginBottom: "10px"
                  }}>
                    <Clock size={14} color="#a78bfa" />
                    Estimated Delivery
                  </label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {DELIVERY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setDeliveryDays(opt.value)}
                        style={{
                          padding: "8px 14px",
                          background: deliveryDays === opt.value
                            ? "rgba(99,102,241,0.25)"
                            : "rgba(255,255,255,0.04)",
                          border: deliveryDays === opt.value
                            ? "1px solid rgba(99,102,241,0.6)"
                            : "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "10px",
                          color: deliveryDays === opt.value ? "#a5b4fc" : "rgba(255,255,255,0.5)",
                          fontSize: "0.78rem", fontWeight: 600,
                          cursor: "pointer", transition: "all 0.2s",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cover Letter */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    color: "rgba(255,255,255,0.7)", fontSize: "0.85rem",
                    fontWeight: 600, marginBottom: "10px"
                  }}>
                    <span>Cover Letter *</span>
                    <span style={{
                      color: charCount >= 30 ? "#10b981" : "rgba(255,255,255,0.3)",
                      fontSize: "0.72rem", fontWeight: 500,
                    }}>
                      {charCount}/30 min chars
                    </span>
                  </label>
                  <textarea
                    rows={6}
                    value={coverLetter}
                    onChange={(e) => { setCoverLetter(e.target.value); setError(""); }}
                    placeholder="Tell the client why you're the best fit for this job. Mention your relevant experience, approach, and what makes you stand out..."
                    style={{
                      width: "100%", padding: "14px 16px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "14px", color: "#fff",
                      fontSize: "0.9rem", fontFamily: "'Inter', sans-serif",
                      lineHeight: 1.6, resize: "vertical",
                      outline: "none", boxSizing: "border-box",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "rgba(99,102,241,0.4)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "10px 14px",
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.25)",
                        borderRadius: "10px", color: "#f87171",
                        fontSize: "0.8rem", marginBottom: "16px",
                      }}
                    >
                      <AlertCircle size={15} />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit summary chip */}
                {isReady && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      padding: "12px 16px",
                      background: "rgba(16,185,129,0.08)",
                      border: "1px solid rgba(16,185,129,0.2)",
                      borderRadius: "12px", color: "#34d399",
                      fontSize: "0.8rem", marginBottom: "20px",
                      display: "flex", gap: "24px",
                    }}
                  >
                    <span>💰 Bid: <strong>{bidAmount} XLM</strong></span>
                    <span>⏱ Delivery: <strong>{DELIVERY_OPTIONS.find(o => o.value === deliveryDays)?.label}</strong></span>
                  </motion.div>
                )}

                {/* Buttons */}
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={onClose}
                    disabled={loading}
                    style={{
                      flex: 1, padding: "14px",
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px", color: "rgba(255,255,255,0.6)",
                      fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!isReady}
                    style={{
                      flex: 2, padding: "14px",
                      background: isReady
                        ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                        : "rgba(99,102,241,0.2)",
                      border: "none", borderRadius: "12px",
                      color: "#fff", fontWeight: 800,
                      cursor: isReady ? "pointer" : "not-allowed",
                      opacity: isReady ? 1 : 0.6,
                      boxShadow: isReady ? "0 8px 24px rgba(99,102,241,0.35)" : "none",
                      transition: "all 0.2s",
                      display: "flex", alignItems: "center",
                      justifyContent: "center", gap: "8px",
                    }}
                  >
                    {loading ? (
                      <>
                        <span style={{
                          width: "16px", height: "16px",
                          border: "2px solid rgba(255,255,255,0.3)",
                          borderTopColor: "#fff", borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                          display: "inline-block",
                        }} />
                        Submitting...
                      </>
                    ) : (
                      "Send Proposal ✈️"
                    )}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </motion.div>
    </div>
  );
}
