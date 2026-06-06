import React, { useState } from "react";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "./DisputeModal.css";

const REASONS = [
  "Work not delivered",
  "Quality issues",
  "Payment dispute",
  "Other"
];

export default function DisputeModal({ isOpen, onClose, jobId, jobTitle, walletAddress, counterParty }) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason || !description.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "disputes"), {
        jobId,
        jobTitle,
        initiator: walletAddress,
        counterParty,
        reason,
        description: description.trim(),
        status: "Open", // Open -> Under Review -> Resolved
        createdAt: serverTimestamp(),
        resolutionWindowEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3-day window
        votes: {
          initiator: null,
          counterParty: null,
          arbitrator: null
        }
      });
      onClose();
    } catch (e) {
      console.error("Dispute error:", e);
      alert("Failed to raise dispute. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dispute-modal-overlay">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="dispute-modal-content"
      >
        <div className="dispute-modal-header">
          <div className="dispute-icon-circle">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h2>Raise Dispute</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: 0 }}>
              Job: {jobTitle} (ID: #{jobId})
            </p>
          </div>
        </div>

        <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>
          Select Reason
        </label>
        <div className="dispute-reason-grid">
          {REASONS.map(r => (
            <div 
              key={r}
              className={`reason-option ${reason === r ? 'active' : ''}`}
              onClick={() => setReason(r)}
            >
              {r}
            </div>
          ))}
        </div>

        <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>
          Evidence & Description
        </label>
        <textarea 
          className="dispute-textarea"
          placeholder="Please describe the issue in detail. Our team will review within 3 days."
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div style={{ 
          padding: '14px', 
          background: 'rgba(239, 68, 68, 0.05)', 
          border: '1px solid rgba(239, 68, 68, 0.2)', 
          borderRadius: '12px',
          color: '#f87171',
          fontSize: '0.8rem',
          marginBottom: '24px',
          display: 'flex',
          gap: '10px'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>Note: Once a dispute is raised, the escrow funds are frozen until a resolution is reached via voting or arbitration.</span>
        </div>

        <div className="dispute-modal-footer">
          <button className="dispute-cancel-btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button 
            className="dispute-submit-btn" 
            onClick={handleSubmit}
            disabled={!reason || !description.trim() || loading}
          >
            {loading ? "Raising..." : "Confirm & Raise Dispute"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
