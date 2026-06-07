import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { 
  Clock, 
  Users, 
  Award,
  Zap,
  Sparkles
} from "lucide-react";
import SearchFilter from "../components/SearchFilter";

const shortenAddr = (addr) => {
  if (!addr || typeof addr !== "string") return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const getStatusKey = (status) => {
  const s = Array.isArray(status) ? status[0] : status;
  if (typeof s === "number") return s;
  if (typeof s === "string") return s;
  if (typeof s === "object" && s !== null) return Object.keys(s)[0];
  return 0;
};

// Simulated metadata based on job ID for visual variety
const JOB_METADATA = {
  categories: ["Programming & Tech", "Graphics & Design", "Writing", "AI Services", "Digital Marketing"],
  skills: ["React", "Solidity", "Stellar", "Rust", "Node.js", "Python", "UI/UX", "Copywriting", "Machine Learning"],
  getMeta: (id) => {
    const num = Number(id) || 0;
    return {
      category: JOB_METADATA.categories[num % JOB_METADATA.categories.length],
      skills: JOB_METADATA.skills.slice(num % 5, (num % 5) + 3),
      exp: num % 3 === 0 ? "Expert" : num % 3 === 1 ? "Intermediate" : "Entry",
      type: num % 2 === 0 ? "Fixed" : "Hourly",
      applicants: num * 3 + (num % 7),
      postedMinutes: num * 12 + 5,
    };
  }
};

export default function FindJobs({ jobs = [], loading, walletAddress, onAccept, onPostJob }) {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // Filter state
  const [filters, setFilters] = useState({
    query: "",
    category: "All Categories",
    maxBudget: 1000,
    experienceLevel: "",
    jobType: "",
    sortBy: "latest"
  });

  const onReset = () => {
    setFilters({
      query: "",
      category: "All Categories",
      maxBudget: 1000,
      experienceLevel: "",
      jobType: "",
      sortBy: "latest"
    });
  };

  // Only open jobs
  const openJobs = useMemo(() => {
    return jobs.filter((j) => {
      const sk = getStatusKey(j.status);
      return sk === 0 || sk === "Open";
    });
  }, [jobs]);

  // Apply filters and sorting
  const filteredJobs = useMemo(() => {
    let result = openJobs.map(job => ({
      ...job,
      _meta: JOB_METADATA.getMeta(job.id),
      _xlm: Number(job.amount) / 10_000_000
    }));

    // Filter Logic
    result = result.filter(job => {
      const q = filters.query.toLowerCase().trim();
      const matchesSearch = !q || 
        job.title?.toLowerCase().includes(q) || 
        job.description?.toLowerCase().includes(q) ||
        job._meta.skills.some(s => s.toLowerCase().includes(q));

      const matchesCategory = filters.category === "All Categories" || job._meta.category === filters.category;
      const matchesBudget = job._xlm <= filters.maxBudget;
      const matchesLevel = !filters.experienceLevel || job._meta.exp === filters.experienceLevel;
      const matchesType = !filters.jobType || job._meta.type === filters.jobType;

      return matchesSearch && matchesCategory && matchesBudget && matchesLevel && matchesType;
    });

    // Sort Logic
    if (filters.sortBy === "budget-high") {
      result.sort((a, b) => b._xlm - a._xlm);
    } else if (filters.sortBy === "budget-low") {
      result.sort((a, b) => a._xlm - b._xlm);
    } else {
      result.sort((a, b) => b.id - a.id); // Latest first
    }

    return result;
  }, [openJobs, filters]);

  // AI Recommendation Logic
  const recommendedJobs = useMemo(() => {
    // Simulate user skills (normally these would come from wallet profile)
    const userSkills = ["React", "Stellar", "UI/UX"];
    
    return openJobs
      .map(job => ({
        ...job,
        _meta: JOB_METADATA.getMeta(job.id),
        _xlm: Number(job.amount) / 10_000_000,
        score: JOB_METADATA.getMeta(job.id).skills.filter(s => userSkills.includes(s)).length
      }))
      .filter(j => j.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [openJobs]);

  const JobCard = ({ job, index }) => {
    const isOwner = String(job.client) === walletAddress;
    const meta = job._meta;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: index * 0.05, duration: 0.4 }}
        className="job-card-premium"
        style={{
          background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.9)",
          border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e8f0",
          borderRadius: "20px",
          padding: "24px",
          marginBottom: "20px",
          position: "relative",
          overflow: "hidden",
          transition: "transform 0.3s ease, border-color 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
          e.currentTarget.style.transform = "translateY(-4px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ 
                background: "rgba(99,102,241,0.1)", 
                color: "#a78bfa", 
                padding: "3px 10px", 
                borderRadius: "20px", 
                fontSize: "0.7rem", 
                fontWeight: 700,
                textTransform: "uppercase"
              }}>
                {meta.category}
              </span>
              <span style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }}>
                <Clock size={14} /> {meta.postedMinutes}m ago
              </span>
            </div>

            <h3 style={{ color: isDark ? "#fff" : "#1a1a2e", fontSize: "1.25rem", fontWeight: 800, margin: "0 0 10px" }}>
              {job.title}
            </h3>

            <p style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.6)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "20px" }}>
              {job.description?.length > 180 ? `${job.description.slice(0, 180)}...` : job.description}
            </p>

            {/* Skills */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
              {meta.skills.map(skill => (
                <span key={skill} style={{ 
                  background: isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9", 
                  color: isDark ? "rgba(255,255,255,0.7)" : "#475569", 
                  padding: "4px 12px", 
                  borderRadius: "8px", 
                  fontSize: "0.75rem", 
                  fontWeight: 600 
                }}>
                  {skill}
                </span>
              ))}
            </div>

            {/* Meta Row */}
            <div style={{ display: "flex", gap: "24px", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.5)", fontSize: "0.85rem", fontWeight: 500 }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Users size={16} color="#6366f1" /> {meta.applicants} Applicants
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Award size={16} color="#fbbf24" /> {meta.exp}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Zap size={16} color="#f472b6" /> {meta.type}
              </span>
            </div>
          </div>

          {/* Right Section */}
          <div style={{ textAlign: "right", minWidth: "140px" }}>
            <div style={{ 
              background: "rgba(52, 211, 153, 0.1)", 
              color: "#34d399", 
              padding: "12px", 
              borderRadius: "16px",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 800,
              fontSize: "1.2rem",
              marginBottom: "16px"
            }}>
              {job._xlm.toFixed(0)} XLM
            </div>

            {isOwner ? (
                <div style={{ 
                  padding: "10px", 
                  background: "rgba(255,255,255,0.05)", 
                  borderRadius: "12px", 
                  color: "rgba(255,255,255,0.4)", 
                  fontSize: "0.8rem", 
                  fontWeight: 600,
                  textAlign: "center"
                }}>
                  Your Job
                </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  onClick={() => onAccept?.(job.id)}
                  style={{ 
                    width: "100%", 
                    padding: "12px", 
                    background: "linear-gradient(135deg, #6366f1, #4f46e5)", 
                    border: "none", 
                    borderRadius: "12px", 
                    color: "#fff", 
                    fontWeight: 700, 
                    cursor: "pointer",
                    boxShadow: "0 10px 20px rgba(99, 102, 241, 0.2)"
                  }}
                >
                  Apply Now
                </button>
                <button
                  onClick={() => navigate("/chat", { state: { recipientAddress: String(job.client) } })}
                  style={{ 
                    width: "100%", 
                    padding: "10px", 
                    background: "transparent", 
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, 
                    borderRadius: "12px", 
                    color: isDark ? "#a78bfa" : "#7c3aed", 
                    fontWeight: 600, 
                    cursor: "pointer"
                  }}
                >
                  Send Message
                </button>
              </div>
            )}

            <div style={{ marginTop: "16px", fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
              Job ID: #{job.id} <br/> 
              Client: {shortenAddr(String(job.client))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "32px", alignItems: "start" }}>
      {/* Sidebar Filters */}
      <SearchFilter 
        filters={filters} 
        setFilters={setFilters} 
        onReset={onReset} 
      />

      {/* Main Content */}
      <div style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h2 style={{ color: isDark ? "#fff" : "#1a1a2e", fontSize: "1.75rem", fontWeight: 800, margin: 0 }}>
              Available Opportunities
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.95rem", marginTop: "4px" }}>
              Showing {filteredJobs.length} active jobs based on your filters
            </p>
          </div>
          <button 
            onClick={onPostJob}
            style={{ 
              padding: "12px 24px", 
              background: "rgba(99,102,241,0.15)", 
              border: "1px solid rgba(99,102,241,0.3)", 
              borderRadius: "12px", 
              color: "#a78bfa", 
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Post a Job
          </button>
        </div>

        {/* AI Recommendations Section */}
        {!filters.query && filters.category === "All Categories" && recommendedJobs.length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <Sparkles size={20} color="#fbbf24" fill="#fbbf24" style={{ filter: "drop-shadow(0 0 8px rgba(251,191,36,0.4))" }} />
              <h3 style={{ color: "#fff", margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>AI Recommended Matches</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {recommendedJobs.map((job, i) => (
                <motion.div
                  key={`rec-${job.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  style={{
                    background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(79,70,229,0.05))",
                    border: "1px solid rgba(99,102,241,0.3)",
                    borderRadius: "16px",
                    padding: "20px",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => setFilters(f => ({ ...f, query: job.title }))}
                >
                  <div style={{ position: "absolute", top: "12px", right: "12px", background: "#fbbf24", color: "#000", fontSize: "0.6rem", fontWeight: 900, padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase" }}>98% Match</div>
                  <h4 style={{ color: "#fff", margin: "0 0 8px", fontSize: "0.95rem" }}>{job.title}</h4>
                  <div style={{ color: "#34d399", fontWeight: 800, fontSize: "1rem", marginBottom: "8px" }}>{(Number(job.amount) / 10_000_000).toFixed(0)} XLM</div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {job._meta.skills.slice(0, 2).map(s => (
                      <span key={s} style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "4px" }}>{s}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
             <div className="spinner-large" />
             <p style={{ color: "rgba(255,255,255,0.4)", marginTop: "16px" }}>Consulting the blockchain...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "80px 40px", background: "rgba(255,255,255,0.02)", borderRadius: "20px", border: "1px dashed rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🕵️‍♂️</div>
            <h3 style={{ color: "#fff", margin: "0 0 10px" }}>No matching jobs found</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "24px" }}>Try broadening your search criteria or resetting filters.</p>
            <button onClick={onReset} style={{ background: "#6366f1", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}>
              Reset All Filters
            </button>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <AnimatePresence>
              {filteredJobs.map((job, i) => (
                <JobCard key={job.id} job={job} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <style>{`
        .spinner-large {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(99,102,241,0.1);
          border-top: 4px solid #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        @media (max-width: 992px) {
          div[style*="grid-template-columns: 300px 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

