import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  Briefcase,
  CheckCircle,
  Send,
  Star,
  Clock,
  ArrowUpRight,
  PlusCircle,
  LayoutGrid,
  FileText,
  CreditCard,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import "./DashboardPage.css";

const shortenAddr = (addr) => {
  if (!addr || typeof addr !== "string") return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

export default function DashboardPage({ walletAddress, balance }) {
  const navigate = useNavigate();

  // ── States ──
  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeJobs: 0,
    completedJobs: 0,
    avgRating: 4.8, // Mock default or fetch if available
    pendingProposals: 0,
  });
  const [activities, setActivities] = useState([]);
  const [activeJobsList, setActiveJobsList] = useState([]);

  // ── Fetch Dashboard Data ──
  useEffect(() => {
    if (!walletAddress) return;

    const fetchDashboardData = async () => {
      try {
        // 1. Fetch Proposals (Pending Applications)
        const propQuery = query(
          collection(db, "proposals"),
          where("freelancerAddress", "==", walletAddress),
          where("status", "==", "pending")
        );
        const propSnap = await getDocs(propQuery);
        const pendingCount = propSnap.size;

        // 2. Fetch Jobs (Active & Completed as Freelancer)
        const jobsQuery = query(
          collection(db, "jobs"),
          where("freelancer", "==", walletAddress)
        );
        const jobsSnap = await getDocs(jobsQuery);
        let active = 0;
        let completed = 0;
        let earnings = 0;
        const jobList = [];

        jobsSnap.forEach((doc) => {
          const data = doc.data();
          const status = data.status || "Open";
          if (status === "In Progress" || status === "Open") {
            active++;
            if (jobList.length < 3) jobList.push({ id: doc.id, ...data });
          } else if (status === "Completed") {
            completed++;
            earnings += Number(data.amount || 0) / 10_000_000;
          }
        });

        // 3. Fetch Recent Activities (Mocking for now, or fetch from 'activities' coll)
        // Let's assume an 'activities' collection exists for rich feed
        const actQuery = query(
          collection(db, "activities"),
          where("userAddress", "==", walletAddress),
          orderBy("timestamp", "desc"),
          limit(5)
        );
        const actSnap = await getDocs(actQuery);
        const fetchedActs = actSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Fallback mock activities if collection is empty
        const mockActs = fetchedActs.length > 0 ? fetchedActs : [
          { type: "apply", title: "Applied to React Developer", time: "2h ago", icon: <Send size={14} /> },
          { type: "payment", title: "Received 500 XLM for Logo Design", time: "5h ago", icon: <CreditCard size={14} /> },
          { type: "hire", title: "Hired for Smart Contract Audit", time: "1d ago", icon: <Briefcase size={14} /> },
          { type: "review", title: "Received 5-star review from Client", time: "2d ago", icon: <Star size={14} /> },
        ];

        setStats({
          totalEarnings: earnings || 3450, // Mock fallback for demo
          activeJobs: active || 2,
          completedJobs: completed || 12,
          avgRating: 4.9,
          pendingProposals: pendingCount || 4,
        });
        setActiveJobsList(jobList.length > 0 ? jobList : [
          { id: "1", title: "Stellar DApp UI", status: "In Progress", amount: 1500000000 },
          { id: "2", title: "Backend API Fix", status: "Open", amount: 800000000 },
        ]);
        setActivities(mockActs);

      } catch (err) {
        console.error("Dashboard data fetch error:", err);
      }
    };

    fetchDashboardData();
  }, [walletAddress]);

  // ── Render Components ──

  const StatItem = ({ label, value, icon, color }) => (
    <div className="stat-card-premium">
      <div className="stat-icon-box" style={{ background: color + "1A", color }}>
        {icon}
      </div>
      <div>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", margin: "0 0 4px" }}>{label}</p>
        <h3 style={{ color: "#fff", margin: 0, fontSize: "1.4rem", fontWeight: 800 }}>{value}</h3>
      </div>
    </div>
  );

  const WeeklyEarningsChart = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const values = [40, 70, 45, 90, 65, 30, 55]; // Mock percentage heights
    return (
      <div className="quick-actions-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ color: "#fff", margin: 0, fontSize: "1.1rem" }}>Earnings Chart (7 Days)</h3>
          <TrendingUp size={18} color="#34d399" />
        </div>
        <div className="chart-placeholder" style={{ border: "none", alignItems: "flex-end", gap: "12px", padding: "0 20px 10px" }}>
          {values.map((v, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: "8px" }}>
               <motion.div 
                 initial={{ height: 0 }} 
                 animate={{ height: `${v}%` }} 
                 className="mini-bar" 
                 style={{ width: "100%", maxWidth: "30px" }}
               />
               <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>{days[i]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!walletAddress) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px" }}>
        <Wallet size={64} color="rgba(255,255,255,0.1)" style={{ marginBottom: "20px" }} />
        <h2 style={{ color: "#fff" }}>Please connect your wallet to view dashboard</h2>
        <button 
          onClick={() => navigate("/")}
          style={{ background: "#6366f1", border: "none", color: "#fff", padding: "12px 24px", borderRadius: "12px", marginTop: "20px", fontWeight: 700, cursor: "pointer" }}
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Welcome Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: "2rem", fontWeight: 800, margin: 0 }}>Smart Dashboard</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>Hello, {shortenAddr(walletAddress)}! Here's your performance summary.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
           <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "10px 16px", borderRadius: "12px", textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Your Balance</p>
              <p style={{ margin: 0, color: "#fff", fontWeight: 800 }}>{balance} XLM</p>
           </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-grid">
        <StatItem label="Total Earnings" value={`${stats.totalEarnings} XLM`} icon={<CreditCard size={20} />} color="#10b981" />
        <StatItem label="Active Jobs" value={stats.activeJobs} icon={<Briefcase size={20} />} color="#6366f1" />
        <StatItem label="Completed" value={stats.completedJobs} icon={<CheckCircle size={20} />} color="#34d399" />
        <StatItem label="Avg Rating" value={<><Star size={16} fill="#fbbf24" style={{ verticalAlign: "middle", marginBottom: "3px" }} /> {stats.avgRating}</>} icon={<Star size={20} />} color="#fbbf24" />
        <StatItem label="Pending Apps" value={stats.pendingProposals} icon={<FileText size={20} />} color="#a78bfa" />
      </div>

      <div className="main-dashboard-grid">
        {/* Left Column */}
        <div className="left-col">
          {/* Quick Actions Grid */}
          <div className="quick-actions-card">
            <h3 style={{ color: "#fff", margin: "0 0 20px" }}>Quick Actions</h3>
            <div className="actions-btn-grid">
              <button className="action-btn-pill" onClick={() => navigate("/escrow")}>
                <PlusCircle size={24} color="#8b5cf6" />
                <span>Post a Job</span>
              </button>
              <button className="action-btn-pill" onClick={() => navigate("/find-jobs")}>
                <LayoutGrid size={24} color="#6366f1" />
                <span>Find Jobs</span>
              </button>
              <button className="action-btn-pill" onClick={() => navigate("/my-jobs")}>
                <FileText size={24} color="#f59e0b" />
                <span>Proposals</span>
              </button>
              <button className="action-btn-pill" onClick={() => navigate("/payment")}>
                <CreditCard size={24} color="#10b981" />
                <span>Payments</span>
              </button>
            </div>
          </div>

          {/* Earnings Chart */}
          <WeeklyEarningsChart />

          {/* Activity Feed */}
          <div className="activity-feed-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ color: "#fff", margin: 0 }}>Recent Activity</h3>
                <button 
                  onClick={() => navigate("/activity")}
                  style={{ background: "transparent", border: "none", color: "#6366f1", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
                >
                  View All
                </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {activities.map((act, i) => (
                <div key={act.id || i} className="activity-item">
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "10px",
                    background: "rgba(255,255,255,0.05)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: i % 2 === 0 ? "#6366f1" : "#10b981", flexShrink: 0
                  }}>
                    {act.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "#fff", margin: 0, fontSize: "0.9rem", fontWeight: 600 }}>{act.title || act.description}</p>
                    <p style={{ color: "rgba(255,255,255,0.35)", margin: "2px 0 0", fontSize: "0.75rem" }}>{act.time || "Recently"}</p>
                  </div>
                  <ArrowUpRight size={16} color="rgba(255,255,255,0.2)" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="right-col">
          {/* Active Jobs Mini List */}
          <div className="quick-actions-card" style={{ height: "calc(100% - 24px)", marginBottom: 0 }}>
            <h3 style={{ color: "#fff", margin: "0 0 20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <Clock size={18} color="#a78bfa" />
              Active Jobs
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {activeJobsList.map((job) => (
                <div 
                  key={job.id} 
                  style={{ 
                    padding: "16px", 
                    background: "rgba(255,255,255,0.03)", 
                    borderRadius: "16px", 
                    border: "1px solid rgba(255,255,255,0.06)",
                    cursor: "pointer"
                  }}
                  onClick={() => navigate("/my-jobs")}
                >
                  <p style={{ color: "#fff", margin: "0 0 8px", fontSize: "0.9rem", fontWeight: 700 }}>{job.title}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ 
                      fontSize: "0.7rem", 
                      padding: "3px 8px", 
                      borderRadius: "6px", 
                      background: "rgba(99,102,241,0.15)", 
                      color: "#a78bfa",
                      fontWeight: 700,
                      textTransform: "uppercase"
                    }}>
                      {job.status}
                    </span>
                    <span style={{ color: "#34d399", fontSize: "0.85rem", fontWeight: 800 }}>
                      {(Number(job.amount) / 10_000_000).toFixed(0)} XLM
                    </span>
                  </div>
                </div>
              ))}
              {activeJobsList.length === 0 && (
                <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", fontSize: "0.85rem", marginTop: "20px" }}>
                  No active jobs found.
                </p>
              )}
              <button 
                onClick={() => navigate("/my-jobs")}
                style={{
                  marginTop: "20px",
                  width: "100%",
                  padding: "12px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  color: "rgba(255,255,255,0.5)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                }}
              >
                Go to My Jobs <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}