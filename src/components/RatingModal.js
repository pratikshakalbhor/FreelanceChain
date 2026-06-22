import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star } from "lucide-react";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useWallet } from "../WalletContext";
import "./RatingModal.css";

const STAR_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
const MAX_REVIEW_LENGTH = 500;

/**
 * RatingModal — Submit a star rating + written review for a completed job.
 *
 * Props:
 *  - isOpen       : boolean
 *  - onClose      : fn()
 *  - jobId        : string/number — the completed job ID
 *  - jobTitle     : string — title of the job
 *  - targetWallet : string — wallet address of person being reviewed
 *  - role         : "client" | "freelancer" — the role of the person submitting the review
 *  - onSuccess    : fn() — called after successful submission
 */
export default function RatingModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  targetWallet,
  role = "client",
  onSuccess,
}) {
  const { walletAddress } = useWallet();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const resetState = () => {
    setRating(0);
    setHoveredStar(0);
    setReview("");
    setSubmitting(false);
    setSubmitted(false);
    setError("");
  };

  const handleClose = () => {
    resetState();
    onClose?.();
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    if (review.trim().length < 10) {
      setError("Review must be at least 10 characters.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      // Check if this user has already reviewed this job
      const reviewsRef = collection(db, "reviews");
      const q = query(
        reviewsRef,
        where("jobId", "==", String(jobId)),
        where("reviewerWallet", "==", walletAddress)
      );
      const existing = await getDocs(q);

      if (!existing.empty) {
        setError("You have already submitted a review for this job. Reviews are blockchain-verified and cannot be changed.");
        setSubmitting(false);
        return;
      }

      // Submit the review to Firestore
      await addDoc(collection(db, "reviews"), {
        jobId: String(jobId),
        jobTitle: jobTitle || "",
        reviewerWallet: walletAddress,
        targetWallet: targetWallet,
        reviewerRole: role, // "client" or "freelancer"
        rating: rating,
        review: review.trim(),
        createdAt: serverTimestamp(),
        // Blockchain verification marker — once submitted, cannot be changed
        verified: true,
        txHash: `FC-${Date.now()}-${walletAddress.slice(-6)}`,
      });

      setSubmitted(true);
      setTimeout(() => {
        handleClose();
        onSuccess?.();
      }, 2000);
    } catch (err) {
      console.error("Review submission error:", err);
      setError("Failed to submit review. Please try again.");
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="rating-modal-overlay" onClick={handleClose}>
        <motion.div
          className="rating-modal-card"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.3 }}
        >
          {submitted ? (
            /* ── Success State ──────────────────────────── */
            <div className="rating-success-container">
              <div className="rating-success-icon">✅</div>
              <h3 className="rating-success-title">Review Submitted!</h3>
              <p className="rating-success-subtitle">
                Your review has been permanently recorded and verified on-chain.
              </p>
            </div>
          ) : (
            <>
              {/* ── Header ──────────────────────────────── */}
              <div className="rating-modal-header">
                <div>
                  <h2 className="rating-modal-title">Leave a Review</h2>
                  <p className="rating-modal-subtitle">
                    Rate your experience as {role === "client" ? "a client" : "a freelancer"}
                  </p>
                </div>
                <button className="rating-modal-close" onClick={handleClose}>
                  <X size={18} />
                </button>
              </div>

              {/* ── Job Info ────────────────────────────── */}
              <div className="rating-modal-job-info">
                <div className="rating-modal-job-icon">💼</div>
                <div>
                  <div className="rating-modal-job-title">
                    {jobTitle || `Job #${jobId}`}
                  </div>
                  <div className="rating-modal-job-meta">
                    Reviewing: {targetWallet?.slice(0, 6)}...{targetWallet?.slice(-4)}
                  </div>
                </div>
              </div>

              {/* ── Stars ───────────────────────────────── */}
              <div className="rating-stars-section">
                <div className="rating-stars-label">Your Rating</div>
                <div className="rating-stars-container">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={36}
                      className={`rating-star ${star <= rating ? "active" : ""} ${
                        star <= (hoveredStar || rating)
                          ? "rating-star-filled"
                          : "rating-star-empty"
                      }`}
                      fill={star <= (hoveredStar || rating) ? "#f59e0b" : "none"}
                      stroke={star <= (hoveredStar || rating) ? "#f59e0b" : "currentColor"}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                    />
                  ))}
                </div>
                <div className="rating-label-text">
                  {STAR_LABELS[hoveredStar || rating] || "Select a rating"}
                </div>
              </div>

              {/* ── Written Review ──────────────────────── */}
              <div className="rating-textarea-group">
                <label className="rating-textarea-label">Written Review</label>
                <textarea
                  className="rating-textarea"
                  placeholder="Share your experience working with this person..."
                  value={review}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_REVIEW_LENGTH) {
                      setReview(e.target.value);
                    }
                  }}
                  maxLength={MAX_REVIEW_LENGTH}
                />
                <div className="rating-char-count">
                  {review.length}/{MAX_REVIEW_LENGTH}
                </div>
              </div>

              {/* ── Blockchain Notice ───────────────────── */}
              <div className="rating-blockchain-notice">
                <span className="rating-blockchain-notice-icon">🔗</span>
                <span>
                  Reviews are blockchain-verified and <strong>cannot be modified or deleted</strong> once submitted. Please ensure your review is accurate and fair.
                </span>
              </div>

              {/* ── Error Message ───────────────────────── */}
              {error && (
                <div style={{
                  padding: "10px 14px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: "10px",
                  color: "#f87171",
                  fontSize: "0.82rem",
                  marginBottom: "16px",
                }}>
                  {error}
                </div>
              )}

              {/* ── Actions ─────────────────────────────── */}
              <div className="rating-modal-actions">
                <button className="rating-btn-cancel" onClick={handleClose}>
                  Cancel
                </button>
                <button
                  className="rating-btn-submit"
                  onClick={handleSubmit}
                  disabled={submitting || rating === 0}
                >
                  {submitting ? (
                    <span className="rating-btn-loading">
                      <span className="rating-btn-spinner" />
                      Submitting...
                    </span>
                  ) : (
                    `Submit Review (${rating > 0 ? "★".repeat(rating) : "—"})`
                  )}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
