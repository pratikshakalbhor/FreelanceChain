import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, onSnapshot, doc, updateDoc, Timestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  User, 
  ArrowLeft,
  CheckCircle,
  Scale,
  ShieldAlert,
  Calendar,
  ExternalLink,
  Info
} from "lucide-react";
import "./ResolutionCenter.css";

export default function ResolutionCenter({ walletAddress }) {
  const [activeTab, setActiveTab] = useState("active");
  const [disputes, setDisputes] = useState([]);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress) return;
    
    // Listen to all disputes where user is involved
    const q = query(collection(db, "disputes"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allDisputes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filter disputes where user is either the one who raised it or the counterparty
      const filtered = allDisputes.filter(d => 
        String(d.raisedBy).toLowerCase() === String(walletAddress).toLowerCase() || 
        String(d.counterParty).toLowerCase() === String(walletAddress).toLowerCase()
      );
      
      setDisputes(filtered);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [walletAddress]);

  const activeDisputes = disputes.filter(d => d.status !== "resolved" && d.status !== "closed");
  const resolvedDisputes = disputes.filter(d => d.status === "resolved" || d.status === "closed");

  const handleVote = async (disputeId, voteType) => {
    const d = disputes.find(it => it.id === disputeId);
    if (!d) return;

    const isInitiator = String(d.raisedBy).toLowerCase() === String(walletAddress).toLowerCase();
    const voteKey = isInitiator ? "initiator" : "counterParty";

    try {
      await updateDoc(doc(db, "disputes", disputeId), {
        [`votes.${voteKey}`]: voteType
      });
      console.log("Vote cast successfully:", voteType);
    } catch (e) {
      console.error("Vote error:", e);
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
    if (s === "open" || s === "active") return <span className="status-badge status-open">Open</span>;
    if (s === "under review" || s === "pending") return <span className="status-badge status-review">Under Review</span>;
    if (s === "resolved") return <span className="status-badge status-resolved">Resolved</span>;
    return <span className="status-badge">{status}</span>;
  };

  const DisputeCard = ({ d }) => (
    <motion.div 
      key={d.id} 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="dispute-card"
      onClick={() => setSelectedDispute(d)}
    >
      <div className="dispute-card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            {getStatusBadge(d.status)}
            <span className="job-id-label">#{d.jobId}</span>
          </div>
          <h3 className="dispute-job-title">{d.jobTitle}</h3>
        </div>
        <div className="dispute-date-box">
          <Calendar size={14} />
          {formatDate(d.createdAt)}
        </div>
      </div>

      <div className="dispute-card-body">
        <div className="dispute-reason-tag">
          <Info size={14} />
          Reason: {d.reason}
        </div>
        <div className="dispute-raised-by">
          <User size={14} />
          By: {String(d.raisedBy).toLowerCase() === String(walletAddress).toLowerCase() ? "You" : d.raisedBy.slice(0, 10) + "..."}
        </div>
      </div>

      <div className="dispute-card-footer">
        <button className="view-details-btn">
          View Details <ExternalLink size={14} />
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="resolution-center-container">
      {/* Header Section */}
      <div className="resolution-header">
        <div>
          <h1>Resolution Center</h1>
          <p>Decentralized conflict resolution and evidence management.</p>
        </div>
        <div className="stats-container">
          <div className="stat-pill">
            <Scale size={20} />
            <span>{activeDisputes.length} Active Cases</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
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

      {/* List View or Detail View */}
      <AnimatePresence mode="wait">
        {!selectedDispute ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="disputes-list-grid"
          >
            {loading ? (
              <div className="empty-state">Loading disputes...</div>
            ) : activeTab === "active" ? (
              activeDisputes.length === 0 ? (
                <div className="empty-state">
                  <ShieldAlert size={48} />
                  <h3>No active disputes</h3>
                  <p>Everything is running smoothly.</p>
                </div>
              ) : activeDisputes.map(d => <DisputeCard d={d} key={d.id} />)
            ) : (
              resolvedDisputes.length === 0 ? (
                <div className="empty-state">
                  <CheckCircle size={48} />
                  <h3>No resolution history</h3>
                  <p>You haven't resolved any disputes yet.</p>
                </div>
              ) : resolvedDisputes.map(d => <DisputeCard d={d} key={d.id} />)
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="dispute-detail-container"
          >
            <button className="back-link" onClick={() => setSelectedDispute(null)}>
              <ArrowLeft size={18} /> Back to List
            </button>

            <div className="detail-layout">
              <div className="detail-main">
                <div className="detail-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    {getStatusBadge(selectedDispute.status)}
                    <span className="case-id">Case #{selectedDispute.id.slice(0, 8)}</span>
                  </div>
                  <h2>{selectedDispute.jobTitle}</h2>
                </div>

                <div className="info-section">
                  <h4>Evidence & Description</h4>
                  <p>{selectedDispute.description}</p>
                </div>

                <div className="timeline-section">
                  <h4>Timeline</h4>
                  <div className="timeline">
                    <div className="timeline-item active">
                      <div className="timeline-point" />
                      <div className="timeline-content">
                        <strong>Dispute Raised</strong>
                        <span>{formatDate(selectedDispute.createdAt)}</span>
                      </div>
                    </div>
                    <div className={`timeline-item ${selectedDispute.status !== 'open' ? 'active' : ''}`}>
                      <div className="timeline-point" />
                      <div className="timeline-content">
                        <strong>Under Review</strong>
                        <span>Automatically triggered</span>
                      </div>
                    </div>
                    <div className={`timeline-item ${selectedDispute.status === 'resolved' ? 'active' : ''}`}>
                      <div className="timeline-point" />
                      <div className="timeline-content">
                        <strong>Resolved</strong>
                        <span>{selectedDispute.resolvedAt ? formatDate(selectedDispute.resolvedAt) : "Pending resolution"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="parties-section">
                  <div className="party-box">
                    <div className="party-label">Initiator</div>
                    <div className="party-address">{selectedDispute.raisedBy}</div>
                  </div>
                  <div className="party-box">
                    <div className="party-label">Counterparty</div>
                    <div className="party-address">{selectedDispute.counterParty}</div>
                  </div>
                </div>
              </div>

              <div className="detail-sidebar">
                <div className="voting-card">
                  <h3>Cast Your Vote</h3>
                  <p>Both parties must vote to reach a mutual resolution. If agreement isn't reached within 3 days, an arbitrator will intervene.</p>
                  
                  <div className="timer-display">
                    <Clock size={16} />
                    {getTimeLeft(selectedDispute.resolutionWindowEnd)}
                  </div>

                  <div className="vote-options">
                    <button 
                      className={`vote-btn refund ${selectedDispute.votes?.[String(selectedDispute.raisedBy).toLowerCase() === String(walletAddress).toLowerCase() ? 'initiator' : 'counterParty'] === 'refund' ? 'active' : ''}`}
                      onClick={() => handleVote(selectedDispute.id, 'refund')}
                    >
                      Vote: Refund Client
                    </button>
                    <button 
                      className={`vote-btn release ${selectedDispute.votes?.[String(selectedDispute.raisedBy).toLowerCase() === String(walletAddress).toLowerCase() ? 'initiator' : 'counterParty'] === 'release' ? 'active' : ''}`}
                      onClick={() => handleVote(selectedDispute.id, 'release')}
                    >
                      Vote: Release Pay
                    </button>
                  </div>

                  <div className="vote-progress">
                    <div className="progress-item">
                      <span>Client Vote</span>
                      {selectedDispute.votes?.initiator ? <CheckCircle size={16} color="#10b981" /> : <Clock size={16} color="rgba(255,255,255,0.2)" />}
                    </div>
                    <div className="progress-item">
                      <span>Freelancer Vote</span>
                      {selectedDispute.votes?.counterParty ? <CheckCircle size={16} color="#10b981" /> : <Clock size={16} color="rgba(255,255,255,0.2)" />}
                    </div>
                  </div>
                </div>

                {selectedDispute.status === "resolved" && (
                  <div className="resolution-result-card">
                    <h4>Resolution Result</h4>
                    <div className="result-value">
                      {selectedDispute.resolutionType || "Funds Released"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
