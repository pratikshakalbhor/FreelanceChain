import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, CheckCircle, XCircle,
  MessageSquare, ChevronDown, ChevronUp, X, Star
} from "lucide-react";
import { db } from "../firebase";
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, addDoc, getDoc, serverTimestamp
} from "firebase/firestore";

const shortenAddr = (addr) => {
  if (!addr || typeof addr !== "string") return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

export default function ViewApplicantsModal({
  isOpen, onClose, job, walletAddress, onHire
}) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [hiringId, setHiringId] = useState(null);
  const [freelancerProfiles, setFreelancerProfiles] = useState({});

  useEffect(() => {
    if (!isOpen || !job?.id) return;
    setLoading(true);

    const q = query(
      collection(db, "proposals"),
      where("jobId", "==", String(job.id))
    );

    const unsub = onSnapshot(q, async (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      
      // Fetch profiles for applicants to get skills/rating
      const newProfiles = {};
      for (const p of data) {
        if (!freelancerProfiles[p.freelancerAddress]) {
          try {
            const uSnap = await getDoc(doc(db, "users", p.freelancerAddress));
            if (uSnap.exists()) {
              newProfiles[p.freelancerAddress] = uSnap.data();
            }
          } catch (e) { console.warn("Profile fetch error:", e); }
        }
      }
      if (Object.keys(newProfiles).length > 0) {
        setFreelancerProfiles(prev => ({ ...prev, ...newProfiles }));
      }

      // Sort: pending first, accepted, rejected last
      data.sort((a, b) => {
        const order = { pending: 0, accepted: 1, rejected: 2 };
        return (order[a.status] ?? 3) - (order[b.status] ?? 3);
      });
      setProposals(data);
      setLoading(false);
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, job?.id]);

  const handleHire = async (proposal) => {
    if (!window.confirm(`Hire ${shortenAddr(proposal.freelancerAddress)} for ${proposal.bidAmount} XLM?`)) return;
    setHiringId(proposal.id);
    try {
      // 1. Accept this proposal
      await updateDoc(doc(db, "proposals", proposal.id), {
        status: "accepted",
        acceptedAt: serverTimestamp()
      });

      // 2. Reject all other pending proposals for this job
      const others = proposals.filter(
        (p) => p.id !== proposal.id && p.status === "pending"
      );
      await Promise.all(
        others.map((p) =>
          updateDoc(doc(db, "proposals", p.id), { 
            status: "rejected",
            rejectedAt: serverTimestamp() 
          })
        )
      );

      // 3. Update the main job document
      await updateDoc(doc(db, "jobs", String(job.id)), {
        acceptedFreelancer: proposal.freelancerAddress,
        status: "InProgress",
        hiredAt: serverTimestamp()
      });

      // 4. Send notification to the hired freelancer
      await addDoc(collection(db, "notifications"), {
        toWallet: proposal.freelancerAddress,
        userId: proposal.freelancerAddress, // for compatibility
        message: "Your application was accepted! ✅",
        title: "🎉 Application Accepted!",
        jobId: String(job.id),
        jobTitle: job.title,
        type: "application_accepted",
        read: false,
        timestamp: serverTimestamp(),
        createdAt: new Date()
      });

      // 5. Send notifications to rejected freelancers
      await Promise.all(others.map(p => 
        addDoc(collection(db, "notifications"), {
          toWallet: p.freelancerAddress,
          userId: p.freelancerAddress,
          message: `Application for "${job.title}" was rejected. ❌`,
          title: "Application Status Update",
          jobId: String(job.id),
          jobTitle: job.title,
          type: "application_rejected",
          read: false,
          timestamp: serverTimestamp(),
          createdAt: new Date()
        })
      ));

      // Trigger cleanup callback
      onHire?.(job.id, proposal.freelancerAddress, proposal);
      alert("🎉 Freelancer hired! Job started!");
      onClose();
    } catch (e) {
      console.error("Hire error:", e);
      alert("Failed to hire. Please check connection and try again.");
    } finally {
      setHiringId(null);
    }
  };

  const handleReject = async (proposal) => {
    try {
      await updateDoc(doc(db, "proposals", proposal.id), { 
        status: "rejected",
        rejectedAt: serverTimestamp() 
      });
      alert("Application rejected");
    } catch (e) {
      console.error("Reject error:", e);
    }
  };

  if (!isOpen || !job) return null;


  const ProposalCard = ({ proposal, i }) => {
    const isExpanded = expandedId === proposal.id;
    const isHiring = hiringId === proposal.id;
    const profile = freelancerProfiles[proposal.freelancerAddress] || {};

    const createdDate = proposal.createdAt?.toDate
      ? proposal.createdAt.toDate().toLocaleString()
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          {/* Avatar + Address */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "50%",
              background: `linear-gradient(135deg, #6366f1, #a855f7)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 800, fontSize: "0.85rem",
            }}>
              {proposal.freelancerAddress?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px" }}>
                {shortenAddr(proposal.freelancerAddress)}
                {profile.rating && (
                  <span style={{ color: "#fbbf24", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "2px" }}>
                    <Star size={12} fill="#fbbf24" /> {profile.rating}
                  </span>
                )}
              </div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem" }}>
                {createdDate}
              </div>
            </div>
          </div>

          {/* Bid */}
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#34d399", fontWeight: 800, fontSize: "1rem" }}>{proposal.bidAmount} XLM</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", textTransform: "uppercase" }}>{proposal.status}</div>
          </div>

          <button onClick={() => setExpandedId(isExpanded ? null : proposal.id)} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {/* Proposal Msg */}
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", fontWeight: 600, marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <MessageSquare size={12} /> PROPOSAL MESSAGE
                </div>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "10px", margin: "0 0 16px" }}>
                  {proposal.coverLetter || "No message provided."}
                </p>

                {/* Skills */}
                {profile.skills && profile.skills.length > 0 && (
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem", fontWeight: 600, marginBottom: "8px" }}>SKILLS</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {profile.skills.map(s => <span key={s} style={{ background: "rgba(99,102,241,0.1)", color: "#a5b4fc", fontSize: "0.7rem", padding: "3px 8px", borderRadius: "4px" }}>{s}</span>)}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {proposal.status === "pending" && String(job.client) === walletAddress && (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button 
                      onClick={() => handleHire(proposal)} 
                      disabled={isHiring}
                      style={{ flex: 1, padding: "10px", background: "linear-gradient(135deg, #10b981, #059669)", border: "none", borderRadius: "8px", color: "#fff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    >
                      <CheckCircle size={16} /> {isHiring ? "Hiring..." : "Accept & Hire"}
                    </button>
                    <button 
                      onClick={() => handleReject(proposal)}
                      style={{ padding: "10px 16px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px", color: "#f87171", fontWeight: 700, cursor: "pointer" }}
                    >
                      <XCircle size={16} />
                    </button>
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(8,13,26,0.9)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", width: "100%", maxWidth: "550px", padding: "24px", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ color: "#fff", fontSize: "1.25rem", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
              <Users size={20} color="#6366f1" /> Applicants
            </h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", margin: "4px 0 0" }}>{job.title} • {proposals.length} total</p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}><X size={24} /></button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, paddingRight: "4px" }}>
          {loading ? (
             <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.4)" }}>Loading candidates...</div>
          ) : proposals.length === 0 ? (
             <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.3)" }}>No applicants yet.</div>
          ) : (
             proposals.map((p, i) => <ProposalCard key={p.id} proposal={p} i={i} />)
          )}
        </div>
      </motion.div>
    </div>
  );
}
