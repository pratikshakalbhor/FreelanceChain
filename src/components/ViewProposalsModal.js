import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, CheckCircle, XCircle, Clock, DollarSign,
  MessageSquare, ChevronDown, ChevronUp, X
} from "lucide-react";
import { db } from "../firebase";
import {
  collection, query, where, onSnapshot,
  doc, updateDoc
} from "firebase/firestore";

const shortenAddr = (addr) => {
  if (!addr || typeof addr !== "string") return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

export default function ViewProposalsModal({
  isOpen, onClose, job, walletAddress, onHire
}) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [hiringId, setHiringId] = useState(null);

  useEffect(() => {
    if (!isOpen || !job?.id) return;
    setLoading(true);

    const q = query(
      collection(db, "proposals"),
      where("jobId", "==", String(job.id))
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Sort: pending first, accepted, rejected last
      data.sort((a, b) => {
        const order = { pending: 0, accepted: 1, rejected: 2 };
        return (order[a.status] ?? 3) - (order[b.status] ?? 3);
      });
      setProposals(data);
      setLoading(false);
    });

    return () => unsub();
  }, [isOpen, job]);

  const handleHire = async (proposal) => {
    if (!window.confirm(`Hire ${shortenAddr(proposal.freelancerAddress)} for ${proposal.bidAmount} XLM?`)) return;
    setHiringId(proposal.id);
    try {
      // Accept this proposal
      await updateDoc(doc(db, "proposals", proposal.id), {
        status: "accepted",
      });

      // Reject all other proposals for this job
      const others = proposals.filter(
        (p) => p.id !== proposal.id && p.status === "pending"
      );
      await Promise.all(
        others.map((p) =>
          updateDoc(doc(db, "proposals", p.id), { status: "rejected" })
        )
      );

      // Trigger onHire callback (parent calls blockchain accept)
      onHire?.(job.id, proposal.freelancerAddress, proposal);
      onClose();
    } catch (e) {
      console.error("Hire error:", e);
      alert("Failed to hire. Please try again.");
    } finally {
      setHiringId(null);
    }
  };

  if (!isOpen || !job) return null;

  const pending = proposals.filter((p) => p.status === "pending");
  const accepted = proposals.filter((p) => p.status === "accepted");
  


  const StatusBadge = ({ status }) => {
    const map = {
      pending: { bg: "rgba(234,179,8,0.15)", color: "#fbbf24", label: "Pending" },
      accepted: { bg: "rgba(16,185,129,0.15)", color: "#34d399", label: "Hired ✓" },
      rejected: { bg: "rgba(239,68,68,0.15)", color: "#f87171", label: "Rejected" },
    };
    const s = map[status] || map.pending;
    return (
      <span style={{
        padding: "3px 10px", borderRadius: "20px",
        background: s.bg, color: s.color,
        fontSize: "0.72rem", fontWeight: 700,
      }}>
        {s.label}
      </span>
    );
  };

  const ProposalCard = ({ proposal, i }) => {
    const isExpanded = expandedId === proposal.id;
    const isHiring = hiringId === proposal.id;

    const createdDate = proposal.createdAt?.toDate
      ? proposal.createdAt.toDate().toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : "Recently";

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        style={{
          background: proposal.status === "accepted"
            ? "rgba(16,185,129,0.06)"
            : "rgba(255,255,255,0.03)",
          border: proposal.status === "accepted"
            ? "1px solid rgba(16,185,129,0.25)"
            : "1px solid rgba(255,255,255,0.07)",
          borderRadius: "16px",
          padding: "16px 20px",
          marginBottom: "10px",
        }}
      >
        {/* Top Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          {/* Avatar + Address */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "50%",
              background: `linear-gradient(135deg, hsl(${(proposal.freelancerAddress?.charCodeAt(2) || 200) * 5 % 360}, 70%, 50%), hsl(${(proposal.freelancerAddress?.charCodeAt(3) || 100) * 5 % 360}, 80%, 40%))`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 800, fontSize: "0.85rem",
              flexShrink: 0,
            }}>
              {proposal.freelancerAddress?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>
                {shortenAddr(proposal.freelancerAddress)}
              </div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", marginTop: "2px" }}>
                Applied {createdDate}
              </div>
            </div>
          </div>

          {/* Bid + Delivery */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ color: "#34d399", fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: "1rem" }}>
              {proposal.bidAmount} XLM
            </div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end", marginTop: "2px" }}>
              <Clock size={11} />
              {proposal.deliveryDays <= 3 ? "1–3 days"
                : proposal.deliveryDays <= 7 ? "3–7 days"
                : proposal.deliveryDays <= 14 ? "1–2 weeks"
                : proposal.deliveryDays <= 28 ? "2–4 weeks"
                : "1+ month"}
            </div>
          </div>

          <StatusBadge status={proposal.status} />

          {/* Expand Button */}
          <button
            onClick={() => setExpandedId(isExpanded ? null : proposal.id)}
            style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: "4px" }}
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {/* Expanded — Cover Letter + Actions */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{
                marginTop: "16px", paddingTop: "16px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}>
                {/* Cover Letter */}
                <div style={{
                  color: "rgba(255,255,255,0.3)", fontSize: "0.72rem",
                  fontWeight: 600, textTransform: "uppercase",
                  letterSpacing: "0.5px", marginBottom: "8px",
                  display: "flex", alignItems: "center", gap: "6px",
                }}>
                  <MessageSquare size={12} /> Cover Letter
                </div>
                <p style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: "0.875rem", lineHeight: 1.65,
                  margin: "0 0 16px",
                  padding: "14px",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}>
                  {proposal.coverLetter}
                </p>

                {/* Action Buttons — only for pending proposals */}
                {proposal.status === "pending" && String(job.client) === walletAddress && (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => handleHire(proposal)}
                      disabled={isHiring}
                      style={{
                        flex: 1, padding: "11px",
                        background: isHiring ? "rgba(16,185,129,0.15)" : "linear-gradient(135deg, #059669, #047857)",
                        border: "none", borderRadius: "10px",
                        color: "#fff", fontWeight: 700,
                        cursor: isHiring ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center",
                        justifyContent: "center", gap: "6px",
                        fontSize: "0.85rem",
                        boxShadow: "0 4px 12px rgba(5,150,105,0.3)",
                      }}
                    >
                      {isHiring ? (
                        <>
                          <span style={{
                            width: "14px", height: "14px",
                            border: "2px solid rgba(255,255,255,0.3)",
                            borderTopColor: "#fff", borderRadius: "50%",
                            animation: "spin 0.8s linear infinite",
                            display: "inline-block"
                          }} />
                          Hiring...
                        </>
                      ) : (
                        <><CheckCircle size={15} /> Hire This Freelancer</>
                      )}
                    </button>
                    <button
                      onClick={async () => {
                        await updateDoc(doc(db, "proposals", proposal.id), { status: "rejected" });
                      }}
                      style={{
                        padding: "11px 16px",
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.25)",
                        borderRadius: "10px",
                        color: "#f87171", fontWeight: 600,
                        cursor: "pointer", fontSize: "0.85rem",
                        display: "flex", alignItems: "center", gap: "6px",
                      }}
                    >
                      <XCircle size={15} /> Reject
                    </button>
                  </div>
                )}

                {proposal.status === "accepted" && (
                  <div style={{
                    padding: "10px 14px",
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.2)",
                    borderRadius: "10px", color: "#34d399",
                    fontSize: "0.8rem", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: "8px",
                  }}>
                    <CheckCircle size={16} /> This freelancer has been hired!
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(8,13,26,0.88)",
        backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1100, padding: "20px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ type: "spring", damping: 22, stiffness: 280 }}
        style={{
          background: "linear-gradient(145deg, #0f172a, #111827)",
          border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: "24px",
          width: "100%", maxWidth: "600px",
          padding: "32px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          maxHeight: "88vh",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "12px",
              background: "rgba(99,102,241,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#818cf8",
            }}>
              <Users size={22} />
            </div>
            <div>
              <h2 style={{ color: "#fff", margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>
                Proposals
              </h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", margin: "3px 0 0" }}>
                {job.title} • {proposals.length} applicant{proposals.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Stats Pills */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {pending.length > 0 && (
              <span style={{ padding: "4px 10px", background: "rgba(234,179,8,0.15)", color: "#fbbf24", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700 }}>
                {pending.length} Pending
              </span>
            )}
            {accepted.length > 0 && (
              <span style={{ padding: "4px 10px", background: "rgba(16,185,129,0.15)", color: "#34d399", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 700 }}>
                {accepted.length} Hired
              </span>
            )}
            <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: "4px" }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Budget indicator */}
        <div style={{
          padding: "10px 16px",
          background: "rgba(52,211,153,0.08)",
          border: "1px solid rgba(52,211,153,0.15)",
          borderRadius: "10px",
          marginBottom: "20px",
          display: "flex", gap: "24px",
          flexShrink: 0,
        }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "6px" }}>
            <DollarSign size={13} color="#34d399" />
            Your Budget: <strong style={{ color: "#34d399" }}>{(Number(job.amount) / 10_000_000).toFixed(0)} XLM</strong>
          </span>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem" }}>
            Job #{job.id}
          </span>
        </div>

        {/* Proposal List */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.4)" }}>
              <div style={{ marginBottom: "12px" }}>Loading proposals...</div>
            </div>
          ) : proposals.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📭</div>
              <h3 style={{ color: "#fff", margin: "0 0 8px" }}>No proposals yet</h3>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
                Freelancers haven't applied yet. Share the job to get more applicants!
              </p>
            </div>
          ) : (
            proposals.map((p, i) => <ProposalCard key={p.id} proposal={p} i={i} />)
          )}
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </motion.div>
    </div>
  );
}
