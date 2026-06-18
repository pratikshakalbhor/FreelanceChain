import React, { useState, useEffect } from "react";
import { AlertCircle, ShieldAlert, CheckCircle, X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import "./DisputeModal.css";

const REASONS = [
  "Work not delivered",
  "Quality issues",
  "Payment dispute",
  "Missed deadline",
  "Scope creep",
  "Other",
];

const MIN_DESC_LENGTH = 20;

export default function DisputeModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  walletAddress,
  counterParty,
  onSuccess,
}) {
  const navigate = useNavigate();
  const [selectedReason, setSelectedReason] = useState("");
  const [evidenceText, setEvidenceText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ESC key support
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, loading, onClose]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      console.log("DisputeModal opened for jobId:", jobId);
      setSelectedReason("");
      setEvidenceText("");
      setError("");
      setSuccess(false);
      setLoading(false);
    }
  }, [isOpen, jobId]);

  const validate = () => {
    if (!selectedReason) {
      setError("Please select a reason for the dispute.");
      return false;
    }
    if (evidenceText.trim().length < MIN_DESC_LENGTH) {
      setError(
        `Description must be at least ${MIN_DESC_LENGTH} characters. (${evidenceText.trim().length}/${MIN_DESC_LENGTH})`
      );
      return false;
    }
    if (!jobId) {
      setError("Job ID is missing. Cannot raise dispute.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async () => {
    console.log(">>> handleSubmit fired!");
    console.log("Data:", { jobId, jobTitle, selectedReason, evidenceText: evidenceText.length, walletAddress, counterParty });

    if (!validate()) {
      console.log("Validation failed:", error);
      return;
    }

    // Check if browser is offline
    if (!navigator.onLine) {
      setError("You appear to be offline. Please check your internet connection and try again.");
      return;
    }

    setLoading(true);
    setError("");

    // Helper: wrap a promise with a timeout
    const withTimeout = (promise, ms) => {
      return Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out. Firebase may be unreachable — check your internet connection.")), ms)
        ),
      ]);
    };

    try {
      // 1. Save dispute document to Firebase
      console.log("Attempting to add dispute doc to Firestore...");
      const disputePayload = {
        jobId: String(jobId),
        jobTitle: jobTitle || "Untitled Job",
        reason: selectedReason,
        description: evidenceText.trim(),
        raisedBy: walletAddress || "unknown",
        counterParty: counterParty || "",
        status: "open",
        createdAt: serverTimestamp(),
        escrowFrozen: true,
        resolutionWindowEnd: Timestamp.fromMillis(
          Date.now() + 3 * 24 * 60 * 60 * 1000
        ),
        votes: {
          initiator: null,
          counterParty: null,
          arbitrator: null,
        },
      };

      const docRef = await withTimeout(
        addDoc(collection(db, "disputes"), disputePayload),
        15000
      );
      console.log("Dispute doc saved with ID:", docRef.id);

      // 2. Update the job document with dispute status
      if (jobId) {
        try {
          console.log("Updating job doc status...");
          const jobRef = doc(db, "jobs", String(jobId));
          await withTimeout(
            updateDoc(jobRef, {
              disputeStatus: "open",
              escrowFrozen: true,
            }),
            10000
          );
          console.log("Job doc updated successfully.");
        } catch (jobUpdateErr) {
          console.warn("Could not update job doc (might be on-chain only):", jobUpdateErr.message);
        }
      }

      // 3. Show success state
      setSuccess(true);
      console.log("Dispute workflow completed successfully!");

      // 4. Auto-close after 2.5 seconds and navigate
      setTimeout(() => {
        onClose();
        if (onSuccess) {
          onSuccess();
        } else {
          navigate("/my-jobs");
        }
      }, 2500);
    } catch (e) {
      console.error("CRITICAL ERROR in handleSubmit:", e);
      setError(
        e?.code === "permission-denied"
          ? "Permission denied. Firebase rules might be blocking this."
          : e?.message?.includes("timed out")
          ? "Request timed out. Firebase may be unreachable — please check your internet and try again."
          : `Error: ${e.message || "Failed to raise dispute."}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
    navigate("/my-jobs"); // As requested: close + go back to MyJobs
  };

  const charCount = evidenceText.trim().length;
  const isReady =
    selectedReason &&
    charCount >= MIN_DESC_LENGTH &&
    !loading;

  if (!isOpen) return null;

  return (
    <div 
      className="dispute-modal-overlay" 
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="dispute-modal-content"
      >
        {/* Close Button */}
        <button 
          className="dispute-close-x" 
          onClick={onClose}
          disabled={loading}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="dispute-modal-header">
          <div className="dispute-icon-circle">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h2>Raise Dispute</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", margin: 0 }}>
              Job: <strong style={{ color: "rgba(255,255,255,0.7)" }}>{jobTitle}</strong>{" "}
              (ID: #{jobId})
            </p>
          </div>
        </div>

        {/* Success State */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "40px 20px",
                gap: "16px",
                textAlign: "center",
              }}
            >
              <div style={{
                width: "64px", height: "64px", borderRadius: "50%",
                background: "rgba(16,185,129,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <CheckCircle size={36} color="#10b981" />
              </div>
              <h3 style={{ color: "#fff", margin: 0 }}>Dispute Raised!</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", margin: 0 }}>
                Escrow funds are frozen. Our team will review within 3 days.
                <br />
                <button 
                  onClick={() => navigate("/resolution-center")}
                  style={{
                    marginTop: "20px",
                    background: "rgba(99, 102, 241, 0.15)",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    color: "#a78bfa",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    margin: "20px auto 0"
                  }}
                >
                  View in Resolution Center <ExternalLink size={14} />
                </button>
                <span style={{ fontSize: "0.75rem", marginTop: "10px", display: "inline-block", opacity: 0.5 }}>
                  Auto-closing soon...
                </span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form — hide when success */}
        {!success && (
          <>
            {/* Reason Grid */}
            <label style={{
              display: "block",
              color: "rgba(255,255,255,0.7)",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "12px"
            }}>
              Select Reason *
            </label>
            <div className="dispute-reason-grid">
              {REASONS.map((r) => (
                <div
                  key={r}
                  className={`reason-option ${selectedReason === r ? "active" : ""}`}
                  onClick={() => {
                    setSelectedReason(r);
                    setError("");
                  }}
                >
                  {r}
                </div>
              ))}
            </div>

            {/* Description */}
            <label style={{
              display: "block",
              color: "rgba(255,255,255,0.7)",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "8px"
            }}>
              Evidence & Description *{" "}
              <span style={{
                color: charCount >= MIN_DESC_LENGTH ? "#10b981" : "rgba(255,255,255,0.3)",
                fontWeight: 500,
                fontSize: "0.75rem"
              }}>
                ({charCount}/{MIN_DESC_LENGTH} min chars)
              </span>
            </label>
            <textarea
              className="dispute-textarea"
              placeholder="Please describe the issue in detail. Include dates, deliverables, and any relevant context. Our team will review within 3 days."
              rows={5}
              value={evidenceText}
              onChange={(e) => {
                setEvidenceText(e.target.value);
                if (error) setError("");
              }}
            />

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 14px",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: "10px",
                    color: "#f87171",
                    fontSize: "0.8rem",
                    marginBottom: "16px",
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Warning Note */}
            <div style={{
              padding: "14px",
              background: "rgba(239, 68, 68, 0.05)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "12px",
              color: "#f87171",
              fontSize: "0.8rem",
              marginBottom: "24px",
              display: "flex",
              gap: "10px",
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>
                Once raised, escrow funds are <strong>frozen</strong> until resolved via voting or arbitration. This action cannot be undone.
              </span>
            </div>

            {/* Footer Buttons */}
            <div className="dispute-modal-footer">
              <button
                className="dispute-cancel-btn"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="dispute-submit-btn"
                onClick={handleSubmit}
                disabled={!isReady}
                style={{
                  opacity: isReady ? 1 : 0.5,
                  cursor: isReady ? "pointer" : "not-allowed",
                  position: "relative",
                }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <span style={{
                      width: "16px", height: "16px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                      display: "inline-block"
                    }} />
                    Submitting...
                  </span>
                ) : (
                  "Confirm & Raise Dispute"
                )}
              </button>
            </div>
          </>
        )}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </motion.div>
    </div>
  );
}
