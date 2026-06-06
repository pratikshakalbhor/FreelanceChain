import React, { useState, useEffect } from "react";
import { Star, ShieldCheck } from "lucide-react";
import { getFirestore, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import app from "../firebase";
import { motion } from "framer-motion";
import "./ReviewCard.css";

const db = getFirestore(app);

/**
 * ReviewCard — Displays a single review with stars, comment, date, and wallet address.
 */
export function ReviewCard({ review }) {
  const formatDate = (timestamp) => {
    if (!timestamp) return "Just now";
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <motion.div
      className="review-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header — Stars + Role */}
      <div className="review-card-header">
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
          <div className="review-card-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                className={`review-card-star ${
                  star <= review.rating
                    ? "review-card-star-filled"
                    : "review-card-star-empty"
                }`}
                fill={star <= review.rating ? "#f59e0b" : "none"}
                stroke={star <= review.rating ? "#f59e0b" : "currentColor"}
              />
            ))}
            <span className="review-card-rating-value">{review.rating}.0</span>
          </div>
          {review.verified && (
            <span className="review-card-verified">
              <ShieldCheck size={12} /> Verified
            </span>
          )}
        </div>
        <span className={`review-card-role ${review.reviewerRole || "client"}`}>
          {review.reviewerRole === "freelancer" ? "Freelancer" : "Client"}
        </span>
      </div>

      {/* Review Text */}
      <p className="review-card-text">{review.review}</p>

      {/* Footer — Wallet + Date */}
      <div className="review-card-footer">
        <div className="review-card-wallet">
          <span className="review-card-wallet-dot" />
          {review.reviewerWallet?.slice(0, 6)}...{review.reviewerWallet?.slice(-4)}
        </div>
        <span className="review-card-date">{formatDate(review.createdAt)}</span>
      </div>

      {/* Job Reference */}
      {review.jobTitle && (
        <div className="review-card-job">
          For: {review.jobTitle}
        </div>
      )}
    </motion.div>
  );
}

/**
 * AverageRating — Shows average star rating with total review count.
 */
export function AverageRating({ reviews = [] }) {
  if (reviews.length === 0) {
    return (
      <div className="review-avg-block">
        <div className="review-avg-number" style={{ color: "rgba(255,255,255,0.2)" }}>
          —
        </div>
        <div>
          <div className="review-avg-stars">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={18}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
              />
            ))}
          </div>
          <div className="review-avg-count">No reviews yet</div>
        </div>
      </div>
    );
  }

  const avg = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
  const roundedAvg = Math.round(avg * 10) / 10;

  return (
    <div className="review-avg-block">
      <div className="review-avg-number">{roundedAvg.toFixed(1)}</div>
      <div>
        <div className="review-avg-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={18}
              fill={star <= Math.round(avg) ? "#f59e0b" : "none"}
              stroke={star <= Math.round(avg) ? "#f59e0b" : "rgba(255,255,255,0.15)"}
              style={star <= Math.round(avg) ? {
                filter: "drop-shadow(0 0 4px rgba(245, 158, 11, 0.4))"
              } : {}}
            />
          ))}
        </div>
        <div className="review-avg-count">
          {roundedAvg.toFixed(1)} out of 5 • {reviews.length} review{reviews.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}

/**
 * ReviewsList — Fetches and displays all reviews for a given wallet address.
 *
 * Props:
 *  - targetWallet : string — wallet address to show reviews for
 *  - refreshKey   : any — change this to trigger a refresh
 */
export function ReviewsList({ targetWallet, refreshKey }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetWallet) {
      setLoading(false);
      return;
    }

    const fetchReviews = async () => {
      setLoading(true);
      try {
        const reviewsRef = collection(db, "reviews");
        const q = query(
          reviewsRef,
          where("targetWallet", "==", targetWallet),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReviews(data);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [targetWallet, refreshKey]);

  if (loading) {
    return (
      <div style={{
        textAlign: "center",
        padding: "40px 0",
        color: "rgba(255,255,255,0.4)",
      }}>
        <div style={{
          width: "32px",
          height: "32px",
          border: "3px solid rgba(99,102,241,0.2)",
          borderTopColor: "#6366f1",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          margin: "0 auto 10px",
        }} />
        Loading reviews...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="reviews-list-container">
      <AverageRating reviews={reviews} />

      <h3 className="reviews-list-title">
        ⭐ Reviews ({reviews.length})
      </h3>

      {reviews.length === 0 ? (
        <div className="reviews-empty-state">
          <div className="reviews-empty-icon">📝</div>
          <p>No reviews yet</p>
        </div>
      ) : (
        reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))
      )}
    </div>
  );
}

/**
 * useUserReviews — Custom hook to fetch reviews for a wallet address.
 * Returns { reviews, averageRating, totalReviews, loading }
 */
export function useUserReviews(walletAddress) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    const fetchReviews = async () => {
      setLoading(true);
      try {
        const reviewsRef = collection(db, "reviews");
        const q = query(
          reviewsRef,
          where("targetWallet", "==", walletAddress)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReviews(data);
      } catch (err) {
        console.error("Error fetching user reviews:", err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [walletAddress]);

  const averageRating =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length) * 10
        ) / 10
      : 0;

  return {
    reviews,
    averageRating,
    totalReviews: reviews.length,
    loading,
  };
}

export default ReviewCard;
