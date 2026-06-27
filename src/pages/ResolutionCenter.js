import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Clock, 
  ArrowLeft,
  CheckCircle,
  Scale,
  ShieldAlert,
  Calendar,
  ExternalLink,
  Info,
  ShieldCheck,
  PlusCircle,
  Briefcase,
  History
} from "lucide-react";
import "./ResolutionCenter.css";

export default function ResolutionCenter({ walletAddress }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("active");
  const [disputes, setDisputes] = useState([]);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Parallel Scalable Queries ──────────────────────────────────────────────
  useEffect(() => {
    if (!walletAddress) return;
    
    // We need two queries because Firestore doesn't support OR on different fields 
    // unless using a complex index/or() filter.
    const q1 = query(collection(db, "disputes"), where("raisedBy", "==", walletAddress));
    const q2 = query(collection(db, "disputes"), where("againstWallet", "==", walletAddress));

    let disputesFromQ1 = [];
    let disputesFromQ2 = [];

    const handleUpdate = () => {
      // Merge results and deduplicate by ID
      const merged = [...disputesFromQ1, ...disputesFromQ2];
      const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
      // Sort by newest first
      unique.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setDisputes(unique);
      setLoading(false);
    };

    const unsub1 = onSnapshot(q1, (snap) => {
      disputesFromQ1 = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      handleUpdate();
    });

    const unsub2 = onSnapshot(q2, (snap) => {
      disputesFromQ2 = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      handleUpdate();
    });

    return () => { unsub1(); unsub2(); };
  }, [walletAddress]);

  const activeDisputes = disputes.filter(d => d.status === "open" || d.status === "under_review");
  const resolvedDisputes = disputes.filter(d => d.status === "resolved");

  const handleVote = async (disputeId, voteType) => {
    const d = disputes.find(it => it.id === disputeId);
    if (!d) return;

    const isInitiator = String(d.raisedBy).toLowerCase() === String(walletAddress).toLowerCase();
    const voteKey = isInitiator ? "initiator" : "againstWallet";

    try {
      await updateDoc(doc(db, "disputes", disputeId), {
        [`votes.${voteKey}`]: voteType
      });
      // Update local state for instant feedback
      setSelectedDispute(prev => ({
        ...prev,
        votes: { ...prev.votes, [voteKey]: voteType }
      }));
    } catch (e) {
      console.error("Voting failed:", e);
    }
  };

  const getTimeLeft = (endDate) => {
    if (!endDate) return "N/A";
    const date = endDate instanceof Timestamp ? endDate.toDate() : new Date(endDate);
    const diff = date - new Date();
    if (diff <= 0) return "Resolution Window Closed";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h remaining`;
  };

  const formatDate = (ts) => {
    if (!ts) return "---";
    const date = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const s = String(status).toLowerCase();
    if (s === "open") return <span className="status-badge status-open">Open</span>;
    if (s === "under_review") return <span className="status-badge status-review">Under Review</span>;
    if (s === "resolved") return <span className="status-badge status-resolved">Resolved</span>;
    return <span className="status-badge">{status}</span>;
  };

  const DisputeCard = ({ d }) => {
    const isInitiator = String(d.raisedBy) === String(walletAddress);
    return (
      <motion.div 
        key={d.id} 
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="dispute-card"
        onClick={() => setSelectedDispute(d)}
      >
        <div className="dispute-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {getStatusBadge(d.status)}
            {isInitiator ? (
              <span className="party-badge initiator">I raised this</span>
            ) : (
              <span className="party-badge defendant">Against me</span>
            )}
          </div>
          <div className="dispute-date-box">
            <Calendar size={12} />
            {formatDate(d.createdAt)}
          </div>
        </div>

        <div className="dispute-card-body">
          <h3 className="dispute-job-title">{d.jobTitle || "Untitled Job"}</h3>
          <div className="dispute-reason-tag">
            <Info size={14} />
            {d.reason}
          </div>
          <p className="dispute-preview-desc">
            {d.description?.length > 120 ? d.description.slice(0, 120) + "..." : d.description}
          </p>
        </div>

        <div className="dispute-card-footer">
          <span className="case-id">#{d.jobId || d.id.slice(0, 8)}</span>
          <button className="view-details-btn">
            View Details <ExternalLink size={14} />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="resolution-center-container">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="resolution-header">
        <div>
          <h1>Resolution Center</h1>
          <p>Decentralized conflict resolution platform for Stellar Escrows.</p>
        </div>
        <div className="stat-pill">
          <ShieldAlert size={18} />
          <span>{activeDisputes.length} Active Cases</span>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="resolution-tabs">
        <button 
          className={`tab-btn ${activeTab === "active" ? "active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          Active Disputes
        </button>
        <button 
          className={`tab-btn ${activeTab === "resolved" ? "active" : ""}`}
          onClick={() => setActiveTab("resolved")}
        >
          Resolved History
        </button>
      </div>

      {/* ── Main List ──────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {!selectedDispute ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="disputes-list-grid"
          >
            {loading ? (
              <div className="empty-state">
                <div className="spinner" />
                <p>Fetching disputes...</p>
              </div>
            ) : activeTab === "active" ? (
              activeDisputes.length === 0 ? (
                <div className="empty-state">
                  <ShieldCheck size={48} color="#10b981" />
                  <h3>No active disputes 🎉</h3>
                  <p>All your jobs are running smoothly!</p>
                  <button className="go-jobs-btn" onClick={() => navigate("/my-jobs")}>
                    Go to My Jobs
                  </button>
                </div>
              ) : activeDisputes.map(d => <DisputeCard d={d} key={d.id} />)
            ) : (
              resolvedDisputes.length === 0 ? (
                <div className="empty-state">
                  <History size={48} color="rgba(255,255,255,0.1)" />
                  <h3>No resolved disputes yet</h3>
                  <p>Your history will appear here once cases are closed.</p>
                </div>
              ) : resolvedDisputes.map(d => <DisputeCard d={d} key={d.id} />)
            )}
            
            {/* If NO disputes exist at all (not loading) */}
            {!loading && disputes.length === 0 && (
              <div className="empty-state">
                <Scale size={48} color="rgba(255,255,255,0.1)" />
                <h3>No disputes found</h3>
                <p>You haven't been involved in any conflicts yet.</p>
                <button className="go-jobs-btn" onClick={() => navigate("/my-jobs")}>
                  Go to My Jobs
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          /* ── Dispute Detail View ───────────────────────────────────────── */
          <motion.div 
            key="detail"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="dispute-detail-container"
          >
            <button className="back-link" onClick={() => setSelectedDispute(null)}>
              <ArrowLeft size={18} /> Back to List
            </button>

            <div className="detail-layout">
              {/* Left Side: Facts & Timeline */}
              <div className="detail-main">
                <div className="detail-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    {getStatusBadge(selectedDispute.status)}
                    <span className="case-id">#{selectedDispute.id.slice(0, 10)}</span>
                  </div>
                  <h2>{selectedDispute.jobTitle}</h2>
                </div>

                <div className="info-section">
                  <h4>Reason for Dispute</h4>
                  <div className="reason-bubble">{selectedDispute.reason}</div>
                  <h4>Evidence Description</h4>
                  <p className="evidence-text">{selectedDispute.description}</p>
                </div>

                <div className="timeline-section">
                  <h4>Case Timeline</h4>
                  <div className="timeline">
                    <div className="timeline-item active">
                      <div className="timeline-point" />
                      <div className="timeline-content">
                        <strong>Dispute Raised</strong>
                        <span>{formatDate(selectedDispute.createdAt)}</span>
                      </div>
                    </div>
                    <div className={`timeline-item ${selectedDispute.status !== 'open' ? 'active' : 'pending'}`}>
                      <div className="timeline-point" />
                      <div className="timeline-content">
                        <strong>Under Review</strong>
                        <span>Automatically assigned to court</span>
                      </div>
                    </div>
                    <div className={`timeline-item ${selectedDispute.status === 'resolved' ? 'active' : 'pending'}`}>
                      <div className="timeline-point" />
                      <div className="timeline-content">
                        <strong>Resolution</strong>
                        <span>{selectedDispute.resolvedAt ? formatDate(selectedDispute.resolvedAt) : "Pending finalized outcome"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="parties-involved">
                  <div className="party-box">
                    <div className="party-label">Raised By</div>
                    <div className="party-addr">{selectedDispute.raisedBy}</div>
                  </div>
                  <div className="party-box">
                    <div className="party-label">Raised Against</div>
                    <div className="party-addr">{selectedDispute.againstWallet}</div>
                  </div>
                </div>
              </div>

              {/* Right Side: Voting & Result */}
              <div className="detail-sidebar">
                {selectedDispute.status !== "resolved" ? (
                  <div className="voting-card">
                    <h3>Resolution Voting</h3>
                    <p>Select your desired outcome. If parties don't agree, the case moves to Arbitration.</p>
                    
                    <div className="timer-badge">
                      <Clock size={16} />
                      {getTimeLeft(selectedDispute.resolutionWindowEnd)}
                    </div>

                    <div className="vote-actions">
                      <button 
                        className={`vote-btn refund ${selectedDispute.votes?.[String(selectedDispute.raisedBy) === String(walletAddress) ? 'initiator' : 'againstWallet'] === 'refund' ? 'active' : ''}`}
                        onClick={() => handleVote(selectedDispute.id, 'refund')}
                      >
                        Refund Client
                      </button>
                      <button 
                        className={`vote-btn release ${selectedDispute.votes?.[String(selectedDispute.raisedBy) === String(walletAddress) ? 'initiator' : 'againstWallet'] === 'release' ? 'active' : ''}`}
                        onClick={() => handleVote(selectedDispute.id, 'release')}
                      >
                        Release Payment
                      </button>
                    </div>

                    <div className="vote-summary">
                      <div className="vote-row">
                        <span>Initiator Vote</span>
                        {selectedDispute.votes?.initiator ? <CheckCircle size={16} color="#10b981" /> : <Clock size={16} color="rgba(255,255,255,0.2)" />}
                      </div>
                      <div className="vote-row">
                        <span>Defendant Vote</span>
                        {selectedDispute.votes?.againstWallet ? <CheckCircle size={16} color="#10b981" /> : <Clock size={16} color="rgba(255,255,255,0.2)" />}
                      </div>
                    </div>

                    <button className="evidence-btn">
                      <PlusCircle size={16} /> Add More Evidence
                    </button>
                  </div>
                ) : (
                  <div className="resolution-result-card">
                    <ShieldCheck size={32} color="#10b981" />
                    <h4>Case Resolved</h4>
                    <p>The final outcome of this dispute was:</p>
                    <div className="result-tag">
                      {selectedDispute.resolutionType || "Funds Released to Freelancer"}
                    </div>
                    <span className="result-date">{formatDate(selectedDispute.resolvedAt)}</span>
                  </div>
                )}
                
                <div className="help-box">
                  <Briefcase size={18} />
                  <div>
                    <h5>Need Help?</h5>
                    <p>Contact our support for complex arbitration cases.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
