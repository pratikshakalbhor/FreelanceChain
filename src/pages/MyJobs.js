import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import RatingModal from "../components/RatingModal";
import DisputeModal from "../components/DisputeModal";
import CertificateModal from "../components/CertificateModal";
import ViewApplicantsModal from "../components/ViewApplicantsModal";
import { 
  ShieldAlert, 
  FileUp, 
  CheckCircle2, 
  Award, 
  Users, 
  Clock, 
  CheckCircle, 
  PlayCircle,
  MessageCircle,
  Eye,
  CreditCard
} from "lucide-react";
import { SUPPORTED_TOKENS } from "../constants";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useWallet } from "../WalletContext";

const STATUS_COLORS = {
  Open: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa", label: "Open" },
  InProgress: { bg: "rgba(234,179,8,0.15)", color: "#facc15", label: "In Progress" },
  Submitted: { bg: "rgba(249,115,22,0.15)", color: "#fb923c", label: "Submitted" },
  Completed: { bg: "rgba(16,185,129,0.15)", color: "#34d399", label: "Completed" },
  Cancelled: { bg: "rgba(239,68,68,0.15)", color: "#f87171", label: "Cancelled" },
  Pending: { bg: "rgba(167,139,250,0.15)", color: "#a78bfa", label: "Pending" },
  Accepted: { bg: "rgba(52,211,153,0.15)", color: "#34d399", label: "Accepted" },
  Rejected: { bg: "rgba(239,68,68,0.15)", color: "#f87171", label: "Rejected" },
  0: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa", label: "Open" },
  1: { bg: "rgba(234,179,8,0.15)", color: "#facc15", label: "In Progress" },
  2: { bg: "rgba(249,115,22,0.15)", color: "#fb923c", label: "Submitted" },
  3: { bg: "rgba(16,185,129,0.15)", color: "#34d399", label: "Completed" },
  4: { bg: "rgba(239,68,68,0.15)", color: "#f87171", label: "Cancelled" },
};

const getStatusKey = (status) => {
  const s = Array.isArray(status) ? status[0] : status;
  if (typeof s === "number") return s;
  if (typeof s === "string") return s;
  if (typeof s === "object" && s !== null) return Object.keys(s)[0];
  return 0;
};

const shortenAddr = (addr) => {
  if (!addr || typeof addr !== "string") return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const Loader2 = ({ className }) => (
  <div className={className} style={{ width: 40, height: 40, border: "4px solid rgba(99,102,241,0.2)", borderTop: "4px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }}>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

export default function MyJobs({ jobs = [], loading: initialLoading, walletAddress, onSubmitWork, onApprove, onCancel, onFindJobs, onAccept }) {
  const { isDark } = useTheme();
  const { userRole } = useWallet();
  const navigate = useNavigate();
  const [subTab, setSubTab] = useState(userRole === "freelancer" ? "applied_proposals" : "posted");
  const [workUrls, setWorkUrls] = useState({});
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [loadingApplied, setLoadingApplied] = useState(false);

  // Modal states
  const [ratingModal, setRatingModal] = useState({ isOpen: false, jobId: null, jobTitle: "", targetWallet: "", role: "client" });
  const [disputeModal, setDisputeModal] = useState({ isOpen: false, jobId: null, jobTitle: "", counterParty: "" });
  const [showDisputeSuccess, setShowDisputeSuccess] = useState(false);
  const [certModal, setCertModal] = useState({ isOpen: false, job: null });
  const [applicantsModal, setApplicantsModal] = useState({ isOpen: false, job: null });
  const [ipfsUploading, setIpfsUploading] = useState({});
  const [jobMetadata, setJobMetadata] = useState({}); // To store applicants count from Firestore

  // ── Real-time Fetch Applied Jobs from Firestore ──
  useEffect(() => {
    if (!walletAddress) return;
    setLoadingApplied(true);
    
    const q = query(
      collection(db, "proposals"),
      where("freelancerAddress", "==", walletAddress)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        jobId: d.data().jobId || d.id 
      }));
      setAppliedJobs(list);
      setLoadingApplied(false);
    }, (e) => {
      console.error("Applied jobs sync fail:", e);
      setLoadingApplied(false);
    });

    return () => unsub();
  }, [walletAddress]);

  // ── Real-time Job Metadata (Applicants Count) for Clients ──
  useEffect(() => {
    if (!walletAddress || userRole !== "client") return;
    
    const q = query(
      collection(db, "jobs"),
      where("client", "==", walletAddress)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const meta = {};
      snap.forEach(doc => {
        meta[doc.id] = doc.data();
      });
      setJobMetadata(meta);
    }, (e) => {
      console.warn("Meta sync failed:", e);
    });

    return () => unsub();
  }, [walletAddress, userRole]);
  const handleIpfsButtonClick = (jobId) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*,application/pdf,.zip";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      setIpfsUploading(p => ({ ...p, [jobId]: true }));
      // Simulate real upload delay proportional to file size
      const delay = Math.min(2000 + (file.size / 1000), 5000); 
      await new Promise(r => setTimeout(r, delay));
      
      const fakeCid = `qm${Math.random().toString(36).substring(2, 15)}`;
      setWorkUrls(p => ({ ...p, [jobId]: `https://ipfs.io/ipfs/${fakeCid}` }));
      setIpfsUploading(p => ({ ...p, [jobId]: false }));
    };
    input.click();
  };

  const postedJobs = jobs.filter((j) => String(j.client) === walletAddress);
  
  // ── Combined Working Jobs (On-chain + Recent Firestore Hires) ──────
  const freelanceJobs = React.useMemo(() => {
    const onChain = jobs.filter((j) => String(j.freelancer) === walletAddress && String(j.freelancer) !== String(j.client));
    
    // Add jobs that are "accepted" in Firestore but might not be indexed on-chain yet
    const recentHires = appliedJobs
      .filter(p => p.status?.toLowerCase() === "accepted")
      .map(p => ({
        id: p.jobId,
        title: p.jobTitle,
        description: "Recently Hired - Start working now!",
        amount: p.bidAmount * 10_000_000, // convert back to stroops for consistency
        token: p.token || "XLM",
        client: p.clientAddress,
        freelancer: walletAddress,
        status: "InProgress",
        isRecentHire: true
      }));

    // Deduplicate by jobId: prefer on-chain record if available
    const seen = new Set(onChain.map(j => String(j.id)));
    return [...onChain, ...recentHires.filter(j => !seen.has(String(j.id)))];
  }, [jobs, appliedJobs, walletAddress]);

  const cardStyle = {
    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.95)",
    border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
    borderRadius: "16px", padding: "20px", marginBottom: "16px",
    boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.2)" : "0 4px 24px rgba(0,0,0,0.08)", transition: "all 0.25s ease",
  };

  const subTabStyle = (key) => ({
    flex: 1, padding: "10px 16px", borderRadius: "10px", border: "none", cursor: "pointer",
    fontWeight: 700, fontSize: "0.85rem", transition: "all 0.2s",
    background: subTab === key ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "transparent",
    color: subTab === key ? "#fff" : isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
  });

  const actionBtn = (gradient, label, onClick, icon = null) => (
    <button onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", background: gradient, border: "none", borderRadius: "10px", color: "#fff", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s" }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
      {icon}
      {label}
    </button>
  );

  const EmptyState = ({ icon, title, subtitle, btnLabel, onBtnClick }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: "3rem", marginBottom: "12px" }}>{icon}</div>
      <h3 style={{ color: isDark ? "#fff" : "#1a1a2e", margin: "0 0 8px" }}>{title}</h3>
      <p style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)", marginBottom: "16px" }}>{subtitle}</p>
      {btnLabel && <button onClick={onBtnClick} style={{ padding: "10px 24px", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 600, cursor: "pointer" }}>{btnLabel}</button>}
    </motion.div>
  );

  const PostedJobCard = ({ job, i }) => {
    const statusKey = getStatusKey(job.status);
    const statusInfo = STATUS_COLORS[statusKey] || STATUS_COLORS[0];
    const token = SUPPORTED_TOKENS.find(t => t.contract === String(job.token)) || SUPPORTED_TOKENS[0];
    const amountVal = (Number(job.amount) / 10_000_000).toFixed(2);
    const freelancer = String(job.freelancer);
    const hasFreelancer = freelancer && freelancer !== walletAddress && freelancer.length > 10;
    const isSubmitted = statusKey === 2 || statusKey === "Submitted";
    const isInProgress = statusKey === 1 || statusKey === "InProgress";

    const meta = jobMetadata[String(job.id)] || {};
    const appCount = meta.applicants?.length || 0;

    return (
      <motion.div key={job.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <h3 style={{ color: isDark ? "#fff" : "#1a1a2e", fontWeight: 700, margin: 0 }}>{job.title}</h3>
              {appCount > 0 && (
                <span style={{ background: "rgba(124, 58, 237, 0.15)", color: "#a78bfa", padding: "2px 8px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 800 }}>
                  👥 {appCount} Applicants
                </span>
              )}
            </div>
            <p style={{ color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)", fontSize: "0.85rem", lineHeight: 1.5, margin: 0 }}>{job.description}</p>
          </div>
          <div style={{ textAlign: "right" }}><span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "20px", background: statusInfo.bg, color: statusInfo.color, fontSize: "0.78rem", fontWeight: 700, marginBottom: "6px" }}>{statusInfo.label}</span><div style={{ color: "#34d399", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{amountVal} {token.symbol}</div></div>
        </div>
        <div style={{ fontSize: "0.72rem", color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)", fontFamily: "'JetBrains Mono', monospace", marginBottom: "12px" }}>Job #{job.id} • Posted by you {hasFreelancer && <span> • Freelancer: {shortenAddr(freelancer)}</span>}</div>
        {job.work_url && <div style={{ padding: "10px 14px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: "10px", marginBottom: "12px", fontSize: "0.82rem", color: "#a5b4fc" }}>📎 Work: <a href={String(job.work_url)} target="_blank" rel="noopener noreferrer" style={{ color: "#818cf8" }}>{String(job.work_url)}</a></div>}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          {isSubmitted && actionBtn("linear-gradient(135deg, #059669, #047857)", "Release Pay", () => onApprove?.(job.id))}
          {(statusKey === 0 || statusKey === "Open") && actionBtn("linear-gradient(135deg, #dc2626, #b91c1c)", "Cancel Job", () => onCancel?.(job.id))}
          {(statusKey === 0 || statusKey === "Open") && actionBtn(
            "linear-gradient(135deg, #6366f1, #4f46e5)",
            `View Applicants (${appCount})`,
            () => setApplicantsModal({ isOpen: true, job }),
            <Users size={14} color="#fff" />
          )}
          {(statusKey === 3 || statusKey === "Completed") && hasFreelancer && actionBtn("linear-gradient(135deg, #f59e0b, #d97706)", "⭐ Rate", () => setRatingModal({ isOpen: true, jobId: job.id, jobTitle: job.title, targetWallet: freelancer, role: "client" }))}
          {(statusKey === 3 || statusKey === "Completed") && actionBtn("rgba(99, 102, 241, 0.15)", "Certificate", () => setCertModal({ isOpen: true, job }), <Award size={14} color="#a78bfa" />)}
          {hasFreelancer && (isInProgress || isSubmitted) && actionBtn("rgba(239, 68, 68, 0.15)", "Dispute", () => setDisputeModal({ isOpen: true, jobId: job.id, jobTitle: job.title, counterParty: freelancer }), <ShieldAlert size={14} color="#f87171" />)}
          {hasFreelancer && <button onClick={() => navigate("/chat", { state: { recipientAddress: freelancer } })} style={{ padding: "9px 18px", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>💬 Chat</button>}
        </div>
      </motion.div>
    );
  };

  const AppliedJobCard = ({ job, i }) => {
    // job object here is actually the PROPOSAL document
    const status = job.status || "pending";
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
    const statusInfo = STATUS_COLORS[statusLabel] || STATUS_COLORS.Pending;
    const amountVal = Number(job.bidAmount || 0).toFixed(0);
    const clientAddress = job.clientAddress || "";

    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
          <div>
            <h3 style={{ color: isDark ? "#fff" : "#1a1a2e", fontWeight: 700, margin: "0 0 4px" }}>{job.jobTitle || "Untitled Job"}</h3>
            <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "6px", color: "rgba(255,255,255,0.4)" }}>Proposal ID: {job.id.slice(0, 8)}...</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "6px", background: statusInfo.bg, color: statusInfo.color, fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "6px" }}>
              {statusLabel === "Accepted" ? "✅ Accepted — You're hired!" : statusInfo.label}
            </span>
            <div style={{ color: "#34d399", fontFamily: "'JetBrains Mono', monospace", fontWeight: 800 }}>{amountVal} XLM</div>
          </div>
        </div>

        <div style={{ fontSize: "0.72rem", color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)", fontFamily: "'JetBrains Mono', monospace", marginBottom: "12px" }}>
          Job #{job.jobId} • Client: {shortenAddr(clientAddress)}
        </div>
        
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "16px" }}>
           {actionBtn("rgba(99, 102, 241, 0.1)", "View Details", () => navigate(`/find-jobs?id=${job.jobId}`), <Eye size={14} color="#a78bfa" />)}
           {actionBtn("rgba(255,255,255,0.05)", "Message Client", () => navigate("/chat", { state: { recipientAddress: clientAddress } }), <MessageCircle size={14} color="#fff" />)}
           
           {statusLabel === "Accepted" && actionBtn("linear-gradient(135deg, #10b981, #059669)", "Submit Work", () => setSubTab("applied"), <CheckCircle size={14} color="#fff" />)}
           {status === "Completed" && actionBtn("rgba(16, 185, 129, 0.15)", "View Payment", () => navigate("/payment"), <CreditCard size={14} color="#34d399" />)}
        </div>
      </motion.div>
    );
  };

  const FreelanceJobCard = ({ job, i }) => {
    const statusKey = getStatusKey(job.status);
    const statusInfo = STATUS_COLORS[statusKey] || STATUS_COLORS[0];
    const token = SUPPORTED_TOKENS.find(t => t.contract === String(job.token)) || SUPPORTED_TOKENS[0];
    const amountVal = (Number(job.amount) / 10_000_000).toFixed(2);
    const isInProgress = statusKey === 1 || statusKey === "InProgress";
    const isSubmitted = statusKey === 2 || statusKey === "Submitted";
    const url = workUrls[job.id] || "";

    return (
      <motion.div key={job.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
          <div style={{ flex: 1 }}><h3 style={{ color: isDark ? "#fff" : "#1a1a2e", fontWeight: 700, margin: "0 0 4px" }}>{job.title}</h3><p style={{ color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)", fontSize: "0.85rem", lineHeight: 1.5, margin: 0 }}>{job.description}</p></div>
          <div style={{ textAlign: "right" }}><span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "20px", background: statusInfo.bg, color: statusInfo.color, fontSize: "0.78rem", fontWeight: 700, marginBottom: "6px" }}>{statusInfo.label}</span><div style={{ color: "#34d399", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{amountVal} {token.symbol}</div></div>
        </div>
        <div style={{ fontSize: "0.72rem", color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)", fontFamily: "'JetBrains Mono', monospace", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span>Job #{job.id} • Client: {shortenAddr(String(job.client))}</span>
          {job.isRecentHire && (
            <span style={{ 
              background: "linear-gradient(135deg, #10b981, #3b82f6)", 
              color: "#fff", 
              padding: "2px 8px", 
              borderRadius: "4px", 
              fontSize: "0.6rem", 
              fontWeight: 800,
              animation: "pulse 2s infinite"
            }}>
              🚀 NEW HIRE
            </span>
          )}
        </div>
        {isInProgress && (
          <div style={{ marginBottom: "12px" }}>
            <label style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)", fontSize: "0.82rem", display: "block", marginBottom: "6px", fontWeight: 600 }}>📎 Work URL / IPFS Proof</label>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <input type="text" placeholder="https://..." value={url} onChange={(e) => setWorkUrls((p) => ({ ...p, [job.id]: e.target.value }))} style={{ flex: 1, padding: "9px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
              {actionBtn("linear-gradient(135deg, #7c3aed, #4f46e5)", "Submit", () => url.trim() && onSubmitWork?.(job.id, url.trim()))}
            </div>
            <button 
              onClick={() => handleIpfsButtonClick(job.id)} 
              disabled={ipfsUploading[job.id]}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px", background: "rgba(167,139,250,0.1)", border: "1px dashed rgba(167,139,250,0.3)", borderRadius: "10px", color: "#a78bfa", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
            >
              <FileUp size={16} />
              {ipfsUploading[job.id] ? "Uploading to IPFS..." : "Upload Final Deliverables to IPFS"}
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          {(statusKey === 3 || statusKey === "Completed") && actionBtn("linear-gradient(135deg, #f59e0b, #d97706)", "⭐ Rate Client", () => setRatingModal({ isOpen: true, jobId: job.id, jobTitle: job.title, targetWallet: String(job.client), role: "freelancer" }))}
          {(statusKey === 3 || statusKey === "Completed") && actionBtn("rgba(99, 102, 241, 0.15)", "Certificate", () => setCertModal({ isOpen: true, job }), <Award size={14} color="#a78bfa" />)}
          {(isInProgress || isSubmitted) && actionBtn("rgba(239, 68, 68, 0.15)", "Dispute", () => setDisputeModal({ isOpen: true, jobId: job.id, jobTitle: job.title, counterParty: String(job.client) }), <ShieldAlert size={14} color="#f87171" />)}
          <button onClick={() => navigate("/chat", { state: { recipientAddress: String(job.client) } })} style={{ padding: "9px 18px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: isDark ? "#a78bfa" : "#6d28d9", fontWeight: 600 }}>💬 Chat</button>
        </div>
      </motion.div>
    );
  };

  return (
    <div>
      {showDisputeSuccess && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "14px 20px", borderRadius: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px", color: "#10b981", fontWeight: 600 }}>
          <CheckCircle2 size={20} />
          Dispute raised successfully! Escrow funds have been frozen.
          <button onClick={() => setShowDisputeSuccess(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#10b981", cursor: "pointer", fontSize: "1.2rem" }}>×</button>
        </motion.div>
      )}

      {/* Primary Tab Navigation */}
      <div style={{ display: "flex", gap: "8px", background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", padding: "6px", borderRadius: "18px", marginBottom: "28px", boxShadow: isDark ? "inset 0 2px 4px rgba(0,0,0,0.2)" : "inset 0 2px 4px rgba(0,0,0,0.05)" }}>
        <button style={subTabStyle("posted")} onClick={() => setSubTab("posted")}>
          <PlayCircle size={18} /> Posted by Me <span style={{ marginLeft: "8px", opacity: 0.7, background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "8px", fontSize: "0.75rem" }}>{postedJobs.length}</span>
        </button>
        <button style={subTabStyle("applied_proposals")} onClick={() => setSubTab("applied_proposals")}>
          <Clock size={18} /> My Applications <span style={{ marginLeft: "8px", opacity: 0.7, background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "8px", fontSize: "0.75rem" }}>{appliedJobs.length}</span>
        </button>
        <button style={subTabStyle("applied")} onClick={() => setSubTab("applied")}>
          <CheckCircle size={18} /> Working Jobs <span style={{ marginLeft: "8px", opacity: 0.7, background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "8px", fontSize: "0.75rem" }}>{freelanceJobs.length}</span>
        </button>
      </div>

      {subTab === "posted" && (
        initialLoading ? <div style={{ textAlign: "center", padding: "100px" }}><Loader2 className="animate-spin" /></div> : 
        postedJobs.length === 0 ? <EmptyState icon="📋" title="No jobs posted" subtitle="Get started by posting a job." btnLabel="Post Job" onBtnClick={() => navigate("/escrow")} /> : 
        postedJobs.map((j, i) => <PostedJobCard key={j.id} job={j} i={i} />)
      )}

      {subTab === "applied_proposals" && (
        loadingApplied ? <div style={{ textAlign: "center", padding: "100px" }}>Loading applications...</div> :
        appliedJobs.length === 0 ? <EmptyState icon="📬" title="No applications (yet)" subtitle="Explore jobs and start applying!" btnLabel="Find Jobs" onBtnClick={() => navigate("/find-jobs")} /> :
        appliedJobs.map((j, i) => <AppliedJobCard key={j.id} job={j} i={i} />)
      )}

      {subTab === "applied" && (
        initialLoading ? <div style={{ textAlign: "center", padding: "100px" }}>Loading jobs...</div> :
        freelanceJobs.length === 0 ? <EmptyState icon="🤝" title="No active work" subtitle="Check your applications to see if you were hired!" btnLabel="Check Applications" onBtnClick={() => setSubTab("applied_proposals")} /> :
        freelanceJobs.map((j, i) => <FreelanceJobCard key={j.id} job={j} i={i} />)
      )}

      <RatingModal isOpen={ratingModal.isOpen} onClose={() => setRatingModal((p) => ({ ...p, isOpen: false }))} jobId={ratingModal.jobId} jobTitle={ratingModal.jobTitle} targetWallet={ratingModal.targetWallet} role={ratingModal.role} />
      <DisputeModal isOpen={disputeModal.isOpen} onClose={() => setDisputeModal((p) => ({ ...p, isOpen: false }))} jobId={disputeModal.jobId} jobTitle={disputeModal.jobTitle} walletAddress={walletAddress} counterParty={disputeModal.counterParty} onSuccess={() => { setShowDisputeSuccess(true); setTimeout(() => setShowDisputeSuccess(false), 5000); }} />
      <CertificateModal isOpen={certModal.isOpen} onClose={() => setCertModal({ isOpen: false, job: null })} job={certModal.job} />
      <ViewApplicantsModal isOpen={applicantsModal.isOpen} onClose={() => setApplicantsModal({ isOpen: false, job: null })} job={applicantsModal.job} walletAddress={walletAddress} onHire={(jobId, freelancerAddress) => { onAccept?.(jobId, freelancerAddress); setApplicantsModal({ isOpen: false, job: null }); }} />
    </div>
  );
}


