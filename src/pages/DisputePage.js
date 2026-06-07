import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { 
  Clock, 
  User, 
  ArrowLeft,
  CheckCircle,
  Scale
} from "lucide-react";
import "./DisputePage.css";

export default function DisputePage({ walletAddress }) {
  const [disputes, setDisputes] = useState([]);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress) return;
    
    const q = query(
      collection(db, "disputes"),
      where("status", "!=", "Deleted") // Simplified query
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filter in JS because Firestore doesn't support OR across fields easily without complex indices
      const myDisputes = list.filter(d => d.initiator === walletAddress || d.counterParty === walletAddress);
      setDisputes(myDisputes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [walletAddress]);

  const handleVote = async (disputeId, voteType) => {
    const d = disputes.find(it => it.id === disputeId);
    if (!d) return;

    const isInitiator = d.initiator === walletAddress;
    const voteKey = isInitiator ? "initiator" : "counterParty";

    try {
      await updateDoc(doc(db, "disputes", disputeId), {
        [`votes.${voteKey}`]: voteType
      });
      // Logic for auto-resolution could go here or in a Cloud Function
    } catch (e) {
      console.error("Vote error:", e);
    }
  };

  const getTimeLeft = (endDate) => {
    if (!endDate) return "N/A";
    const diff = endDate.toDate() - new Date();
    if (diff <= 0) return "Window Closed";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h left`;
  };

  return (
    <div className="dispute-page-container">
      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>Resolution Center</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>Manage disputes and reach outcomes via decentralized voting.</p>
        </div>
        <div style={{ padding: '12px 20px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '16px', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scale size={20} />
          <span style={{ fontWeight: 700 }}>{disputes.length} Active Cases</span>
        </div>
      </div>

      {!selectedDispute ? (
        <div className="dispute-list">
          {disputes.length === 0 && !loading ? (
            <div style={{ textAlign: 'center', padding: '80px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚖️</div>
              <h3 style={{ color: '#fff' }}>No active disputes</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>Everything is running smoothly. Happy freelancing!</p>
            </div>
          ) : (
            disputes.map(d => (
              <motion.div 
                key={d.id} 
                layoutId={d.id}
                className="dispute-item-card"
                onClick={() => setSelectedDispute(d)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span className={`dispute-status-pill ${d.status.toLowerCase().replace(' ', '-')}`}>
                      {d.status}
                    </span>
                    <h3 style={{ color: '#fff', margin: '12px 0 4px', fontSize: '1.2rem' }}>{d.jobTitle}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0 }}>
                      Initiated by: {d.initiator === walletAddress ? "You" : d.initiator.slice(0, 12) + "..."}
                    </p>
                  </div>
                  <div className="timer-box">
                    <Clock size={16} />
                    {getTimeLeft(d.resolutionWindowEnd)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                    Reason: {d.reason}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dispute-detail-view">
          <button className="back-btn" onClick={() => setSelectedDispute(null)}>
            <ArrowLeft size={18} /> Back to Dashboard
          </button>

          <div style={{ display: 'flex', gap: '32px', marginTop: '32px' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 800, marginBottom: '24px' }}>Case Details</h2>
              
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
                <div style={{ color: '#a78bfa', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Description</div>
                <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>{selectedDispute.description}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '0.9rem', marginBottom: '4px' }}>
                    <User size={16} color="#60a5fa" /> Initiator
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontFamily: 'monospace' }}>{selectedDispute.initiator}</div>
                </div>
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '0.9rem', marginBottom: '4px' }}>
                    <User size={16} color="#f472b6" /> Defendant
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontFamily: 'monospace' }}>{selectedDispute.counterParty}</div>
                </div>
              </div>
            </div>

            <div style={{ width: '350px' }}>
              <div className="voting-section">
                <h4 style={{ color: '#fff', margin: '0 0 8px' }}>Your Vote</h4>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: '24px' }}>
                  Cast your vote to reach a resolution. If both parties agree, funds are released/refunded automatically.
                </p>

                <div className="vote-btns">
                  <button 
                    className={`vote-btn ${selectedDispute.votes?.[selectedDispute.initiator === walletAddress ? 'initiator' : 'counterParty'] === 'refund' ? 'active refund' : ''}`}
                    onClick={() => handleVote(selectedDispute.id, 'refund')}
                  >
                    Refund Client
                  </button>
                  <button 
                    className={`vote-btn ${selectedDispute.votes?.[selectedDispute.initiator === walletAddress ? 'initiator' : 'counterParty'] === 'release' ? 'active release' : ''}`}
                    onClick={() => handleVote(selectedDispute.id, 'release')}
                  >
                    Release Pay
                  </button>
                </div>

                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginBottom: '12px', fontWeight: 700 }}>VOTING STATUS</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#fff' }}>Client</span>
                    {selectedDispute.votes?.initiator ? <CheckCircle size={16} color="#10b981" /> : <Clock size={16} color="rgba(255,255,255,0.2)" />}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.8rem', color: '#fff' }}>Freelancer</span>
                    {selectedDispute.votes?.counterParty ? <CheckCircle size={16} color="#10b981" /> : <Clock size={16} color="rgba(255,255,255,0.2)" />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
