import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Clock,
  Users,
  Award,
  Zap,
  Sparkles,
  ChevronLeft,
  Send,
  Brain,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import SearchFilter from "../components/SearchFilter";
import ProposalModal from "../components/ProposalModal";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  fetchUserSkills,
  getMatchBadgeStyle,
} from "../utils/jobMatchingUtils";

/* ─── Helpers ─────────────────────────────────────────────────── */
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

/* ─── Simulated metadata (keeps existing visual variety) ────── */
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
  },
};

/* ─── Match Badge ────────────────────────────────────────────── */
function MatchBadge({ matchPct }) {
  if (!matchPct && matchPct !== 0) return null;
  const style = getMatchBadgeStyle(matchPct);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "0.65rem",
        fontWeight: 900,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      <Brain size={11} />
      {style.label}
    </div>
  );
}

/* ─── Toast Component ────────────────────────────────────────── */
function Toast({ message, type = "success", onClear }) {
  useEffect(() => {
    const timer = setTimeout(onClear, 3000);
    return () => clearTimeout(timer);
  }, [onClear]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{
        position: "fixed",
        bottom: "32px",
        left: "50%",
        transform: "translateX(-50%)",
        background: type === "success" ? "#10b981" : "#ef4444",
        color: "#fff",
        padding: "12px 24px",
        borderRadius: "12px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontWeight: 700,
        fontSize: "0.9rem",
      }}
    >
      {type === "success" ? <CheckCircle2 size={18} /> : <Zap size={18} />}
      {message}
    </motion.div>
  );
}

/* ─── No Profile Banner ──────────────────────────────────────── */
function NoProfileBanner({ onNavigate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))",
        border: "1px solid rgba(99,102,241,0.25)",
        borderRadius: "16px",
        padding: "18px 24px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        marginBottom: "28px",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "12px",
          background: "rgba(99,102,241,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Brain size={22} color="#a78bfa" />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ color: "#c4b5fd", fontWeight: 700, margin: "0 0 4px", fontSize: "0.95rem" }}>
          ✨ Unlock AI Job Matching
        </p>
        <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: "0.82rem" }}>
          Complete your profile with skills to get personalised match scores on every job.
        </p>
      </div>
      <button
        onClick={onNavigate}
        style={{
          padding: "9px 20px",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          border: "none",
          borderRadius: "10px",
          color: "#fff",
          fontWeight: 700,
          fontSize: "0.8rem",
          cursor: "pointer",
          whiteSpace: "nowrap",
          boxShadow: "0 6px 20px rgba(99,102,241,0.3)",
        }}
      >
        Complete Profile
      </button>
    </motion.div>
  );
}

/* ─── AI Recommended Section ─────────────────────────────────── */
function AIRecommendedSection({ jobs, userSkills, onOpenModal }) {
  if (!jobs || jobs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ marginBottom: "36px" }}
    >
      {/* Section Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.1))",
            border: "1px solid rgba(251,191,36,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Sparkles size={18} color="#fbbf24" fill="#fbbf24" />
        </div>
        <div>
          <h3
            style={{
              color: "#fff",
              margin: 0,
              fontSize: "1.05rem",
              fontWeight: 800,
              background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            AI Recommended for You
          </h3>
        </div>
        <span
          style={{
            marginLeft: "4px",
            background: "rgba(251,191,36,0.1)",
            border: "1px solid rgba(251,191,36,0.2)",
            color: "#fbbf24",
            padding: "2px 10px",
            borderRadius: "20px",
            fontSize: "0.7rem",
            fontWeight: 700,
          }}
        >
          {jobs.length} matches
        </span>
      </div>
      <p
        style={{
          color: "rgba(255,255,255,0.4)",
          margin: "0 0 18px 46px",
          fontSize: "0.8rem",
        }}
      >
        Based on your skills:{" "}
        <span style={{ color: "#a78bfa" }}>
          {userSkills.slice(0, 4).join(", ")}
          {userSkills.length > 4 ? ` +${userSkills.length - 4} more` : ""}
        </span>
      </p>

      {/* Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
          gap: "16px",
        }}
      >
        {jobs.map((job, i) => {
          const badge = getMatchBadgeStyle(job._matchPct);
          return (
            <motion.div
              key={`rec-${job.id}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.02, y: -4 }}
              onClick={() => onOpenModal(job)}
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.13), rgba(79,70,229,0.05))",
                border: "1px solid rgba(99,102,241,0.28)",
                borderRadius: "18px",
                padding: "20px",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                transition: "border-color 0.3s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.28)"; }}
            >
              {/* Glow accent */}
              <div
                style={{
                  position: "absolute",
                  top: "-30px",
                  right: "-30px",
                  width: "100px",
                  height: "100px",
                  background: `radial-gradient(circle, ${badge.bg} 0%, transparent 70%)`,
                  pointerEvents: "none",
                }}
              />

              {/* Match Badge */}
              <div style={{ position: "absolute", top: "14px", right: "14px" }}>
                <div
                  style={{
                    background: badge.bg,
                    border: `1px solid ${badge.border}`,
                    color: badge.color,
                    padding: "3px 10px",
                    borderRadius: "20px",
                    fontSize: "0.62rem",
                    fontWeight: 900,
                    letterSpacing: "0.05em",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Brain size={10} />
                  {badge.label}
                </div>
              </div>

              <h4
                style={{
                  color: "#fff",
                  margin: "0 80px 10px 0",
                  fontSize: "0.97rem",
                  fontWeight: 700,
                  lineHeight: 1.4,
                }}
              >
                {job.title}
              </h4>

              <div
                style={{
                  color: "#34d399",
                  fontWeight: 800,
                  fontSize: "1.05rem",
                  marginBottom: "14px",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {(Number(job.amount) / 10_000_000).toFixed(0)} XLM
              </div>

              {/* Matched skills */}
              {job._matchedSkills && job._matchedSkills.length > 0 && (
                <div style={{ marginBottom: "10px" }}>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.65rem", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Matches your skills
                  </p>
                  <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                    {job._matchedSkills.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        style={{
                          fontSize: "0.65rem",
                          color: "#34d399",
                          background: "rgba(52,211,153,0.1)",
                          border: "1px solid rgba(52,211,153,0.2)",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <CheckCircle2 size={9} /> {s}
                      </span>
                    ))}
                    {job._missingSkills && job._missingSkills.length > 0 && (
                      <span
                        style={{
                          fontSize: "0.65rem",
                          color: "rgba(255,255,255,0.35)",
                          background: "rgba(255,255,255,0.04)",
                          padding: "2px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        +{job._missingSkills.length} more req.
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "0.75rem",
                  marginTop: "10px",
                }}
              >
                <Send size={12} />
                Click to submit proposal
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Divider */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          margin: "32px 0 0",
        }}
      >
        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.75rem", whiteSpace: "nowrap" }}>
          All Available Jobs
        </span>
        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
      </div>
    </motion.div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function FindJobs({ jobs = [], loading, walletAddress, onAccept, onPostJob }) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [proposalModal, setProposalModal] = useState({ isOpen: false, job: null });
  const [searchParams, setSearchParams] = useSearchParams();

  /* ── AI Matching State ── */
  const [userSkills, setUserSkills] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState(null); // null = unknown, true/false

  /* ── Fetch user skills from Firebase ── */
  useEffect(() => {
    if (!walletAddress) {
      setHasProfile(false);
      return;
    }
    setSkillsLoading(true);
    fetchUserSkills(walletAddress)
      .then((skills) => {
        setUserSkills(skills);
        setHasProfile(skills.length > 0);
      })
      .catch(() => setHasProfile(false))
      .finally(() => setSkillsLoading(false));
  }, [walletAddress]);

  /* ── One-Click Apply State ── */
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [applyingId, setApplyingId] = useState(null);
  const [toast, setToast] = useState(null);

  /* ── Fetch user applied jobs ── */
  useEffect(() => {
    if (!walletAddress) return;
    const fetchApplied = async () => {
      try {
        const q = query(
          collection(db, "proposals"),
          where("freelancerAddress", "==", walletAddress)
        );
        const snap = await getDocs(q);
        const ids = new Set(snap.docs.map((d) => d.data().jobId));
        setAppliedJobIds(ids);
      } catch (e) {
        console.warn("Failed to fetch applied jobs:", e);
      }
    };
    fetchApplied();
  }, [walletAddress]);

  /* ── Quick Apply Function ── */
  const handleQuickApply = useCallback(async (job) => {
    if (!walletAddress) {
      setToast({ message: "Please connect your wallet first", type: "error" });
      return;
    }
    if (appliedJobIds.has(String(job.id))) return;

    setApplyingId(job.id);
    try {
      // Get profile info (bio/skills)
      const userRef = doc(db, "users", walletAddress);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};

      const bio = userData.bio || "I am interested in this job and have the required skills.";
      const skills = userData.skills || [];

      // Submit proposal
      await addDoc(collection(db, "proposals"), {
        jobId: String(job.id),
        jobTitle: job.title,
        clientAddress: String(job.client),
        freelancerAddress: walletAddress,
        coverLetter: `[Quick Apply] ${bio} \n\nSkills: ${skills.join(", ")}`,
        bidAmount: job._xlm || 0,
        originalBudget: job._xlm || 0,
        deliveryDays: 7, // Default
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setAppliedJobIds((prev) => new Set([...prev, String(job.id)]));
      setToast({ message: `Applied to ${job.title}! ✓`, type: "success" });
    } catch (e) {
      console.error("Quick apply error:", e);
      setToast({ message: "Failed to apply. Try again.", type: "error" });
    } finally {
      setApplyingId(null);
    }
  }, [walletAddress, appliedJobIds]);

  /* ── URL param reading ── */
  const initialCategory = searchParams.get("category") || "All Categories";
  const initialQuery = searchParams.get("search") || "";
  const initialBudget = Number(searchParams.get("budget")) || 5000;
  const initialExp = searchParams.get("exp") || "";
  const initialType = searchParams.get("type") || "";

  const [filters, setFilters] = useState({
    query: initialQuery,
    category: initialCategory,
    maxBudget: initialBudget,
    experienceLevel: initialExp,
    jobType: initialType,
    sortBy: "ai-match",
  });

  useEffect(() => {
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "All Categories";
    const budget = Number(searchParams.get("budget")) || 5000;
    const exp = searchParams.get("exp") || "";
    const type = searchParams.get("type") || "";
    setFilters((prev) => ({ ...prev, query: search, category, maxBudget: budget, experienceLevel: exp, jobType: type }));
    if (search) document.title = `Search: ${search} | Find Jobs`;
    else if (category !== "All Categories") document.title = `${category} | Find Jobs`;
    else document.title = "Find Jobs | FreelanceChain";
  }, [searchParams]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    const params = {};
    if (newFilters.query) params.search = newFilters.query;
    if (newFilters.category !== "All Categories") params.category = newFilters.category;
    if (newFilters.maxBudget !== 5000) params.budget = newFilters.maxBudget;
    if (newFilters.experienceLevel) params.exp = newFilters.experienceLevel;
    if (newFilters.jobType) params.type = newFilters.jobType;
    setSearchParams(params);
  };

  const onReset = () => setSearchParams({});

  /* ── Open jobs only ── */
  const openJobs = useMemo(
    () =>
      jobs.filter((j) => {
        const sk = getStatusKey(j.status);
        return sk === 0 || sk === "Open";
      }),
    [jobs]
  );

  /* ── Apply metadata enrichment ── */
  const enrichedJobs = useMemo(
    () =>
      openJobs.map((job) => ({
        ...job,
        _meta: JOB_METADATA.getMeta(job.id),
        _xlm: Number(job.amount) / 10_000_000,
      })),
    [openJobs]
  );

  /* ── Filter logic ── */
  const filteredJobs = useMemo(() => {
    let result = enrichedJobs.filter((job) => {
      const q = filters.query.toLowerCase().trim();
      const matchesSearch =
        !q ||
        job.title?.toLowerCase().includes(q) ||
        job.description?.toLowerCase().includes(q) ||
        job._meta.skills.some((s) => s.toLowerCase().includes(q));
      const matchesCategory =
        filters.category === "All Categories" || job._meta.category === filters.category;
      const matchesBudget = job._xlm <= filters.maxBudget;
      const matchesLevel = !filters.experienceLevel || job._meta.exp === filters.experienceLevel;
      const matchesType = !filters.jobType || job._meta.type === filters.jobType;
      return matchesSearch && matchesCategory && matchesBudget && matchesLevel && matchesType;
    });

    // Attach match scores
    if (userSkills.length > 0) {
      result = result.map((job) => {
        const jobSkills = [
          ...(job.requiredSkills || []),
          ...job._meta.skills,
        ];
        const normalized = jobSkills.map((s) => String(s).toLowerCase().trim());
        const matched = normalized.filter((js) =>
          userSkills.some((us) => us === js || js.includes(us) || us.includes(js))
        );
        const missing = normalized.filter((js) => !matched.includes(js));
        const matchPct = normalized.length > 0 ? Math.round((matched.length / normalized.length) * 100) : 0;
        return { ...job, _matchScore: matched.length, _matchedSkills: matched, _missingSkills: missing, _matchPct: matchPct };
      });
    }

    // Sort logic
    if (filters.sortBy === "ai-match" && userSkills.length > 0) {
      result.sort((a, b) => (b._matchPct || 0) - (a._matchPct || 0));
    } else if (filters.sortBy === "budget-high") {
      result.sort((a, b) => b._xlm - a._xlm);
    } else if (filters.sortBy === "budget-low") {
      result.sort((a, b) => a._xlm - b._xlm);
    } else {
      result.sort((a, b) => b.id - a.id);
    }

    return result;
  }, [enrichedJobs, filters, userSkills]);

  /* ── AI Recommended jobs (top 3 high match) ── */
  const recommendedJobs = useMemo(() => {
    if (userSkills.length === 0) return [];
    return filteredJobs
      .filter((j) => j._matchPct >= 50)
      .slice(0, 4);
  }, [filteredJobs, userSkills]);

  /* ── Show AI section only when not filtering ── */
  const showAISection =
    !filters.query &&
    filters.category === "All Categories" &&
    !filters.experienceLevel &&
    !filters.jobType;

  /* ─── Job Card ── */
  const JobCard = useCallback(
    ({ job, index }) => {
      const isOwner = String(job.client) === walletAddress;
      const meta = job._meta;
      const hasMatch = job._matchPct !== undefined;

      return (
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ delay: index * 0.04, duration: 0.35 }}
          style={{
            background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.9)",
            border: isDark
              ? `1px solid ${hasMatch && job._matchPct >= 80 ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.06)"}`
              : "1px solid #e2e8f0",
            borderRadius: "20px",
            padding: "24px",
            marginBottom: "16px",
            position: "relative",
            overflow: "hidden",
            transition: "transform 0.3s ease, border-color 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
            e.currentTarget.style.transform = "translateY(-4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor =
              isDark
                ? hasMatch && job._matchPct >= 80
                  ? "rgba(52,211,153,0.15)"
                  : "rgba(255,255,255,0.06)"
                : "#e2e8f0";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {/* Match % progress bar accent */}
          {hasMatch && job._matchPct > 0 && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "3px",
                width: `${job._matchPct}%`,
                background:
                  job._matchPct >= 80
                    ? "linear-gradient(90deg, #34d399, #10b981)"
                    : job._matchPct >= 60
                    ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
                    : "linear-gradient(90deg, #6366f1, #8b5cf6)",
                borderRadius: "3px 3px 0 0",
                transition: "width 0.8s ease",
              }}
            />
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              {/* Top row: category + time + match badge */}
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
                <span
                  style={{
                    background: "rgba(99,102,241,0.1)",
                    color: "#a78bfa",
                    padding: "3px 10px",
                    borderRadius: "20px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  {meta.category}
                </span>
                <span
                  style={{
                    color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)",
                    fontSize: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Clock size={14} /> {meta.postedMinutes}m ago
                </span>
                {/* AI Match Badge */}
                {hasMatch && job._matchPct > 0 && <MatchBadge matchPct={job._matchPct} />}
              </div>

              <h3
                style={{ color: isDark ? "#fff" : "#1a1a2e", fontSize: "1.25rem", fontWeight: 800, margin: "0 0 10px" }}
              >
                {job.title}
              </h3>

              <p
                style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.6)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "16px" }}
              >
                {job.description?.length > 180 ? `${job.description.slice(0, 180)}...` : job.description}
              </p>

              {/* Skills with match highlight */}
              <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "16px" }}>
                {meta.skills.map((skill) => {
                  const isMatched =
                    job._matchedSkills &&
                    job._matchedSkills.some(
                      (m) => m === skill.toLowerCase() || m.includes(skill.toLowerCase())
                    );
                  return (
                    <span
                      key={skill}
                      style={{
                        background: isMatched ? "rgba(52,211,153,0.1)" : isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9",
                        color: isMatched ? "#34d399" : isDark ? "rgba(255,255,255,0.7)" : "#475569",
                        border: isMatched ? "1px solid rgba(52,211,153,0.2)" : "1px solid transparent",
                        padding: "4px 12px",
                        borderRadius: "8px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {isMatched && <CheckCircle2 size={11} />}
                      {skill}
                    </span>
                  );
                })}
              </div>

              {/* Reasoning text */}
              {hasMatch && job._matchPct > 0 && job._matchedSkills && job._matchedSkills.length > 0 && (
                <p
                  style={{
                    color: "rgba(52,211,153,0.7)",
                    fontSize: "0.75rem",
                    margin: "0 0 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Brain size={12} />
                  Matches your{" "}
                  {job._matchedSkills
                    .slice(0, 3)
                    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                    .join(", ")}{" "}
                  skills
                </p>
              )}

              {/* Meta row */}
              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.5)",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  flexWrap: "wrap",
                }}
              >
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
              <div
                style={{
                  background: "rgba(52,211,153,0.1)",
                  color: "#34d399",
                  padding: "12px",
                  borderRadius: "16px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 800,
                  fontSize: "1.2rem",
                  marginBottom: "16px",
                }}
              >
                {job._xlm.toFixed(0)} XLM
              </div>

              {isOwner ? (
                <div
                  style={{
                    padding: "10px",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "12px",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  Your Job
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {appliedJobIds.has(String(job.id)) ? (
                    <div
                      style={{
                        padding: "12px",
                        background: "rgba(52, 211, 153, 0.1)",
                        border: "1px solid rgba(52, 211, 153, 0.2)",
                        borderRadius: "12px",
                        color: "#34d399",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        textAlign: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      <CheckCircle2 size={16} /> Applied
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleQuickApply(job)}
                        disabled={applyingId === job.id}
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "rgba(16, 185, 129, 0.1)",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                          borderRadius: "12px",
                          color: "#34d399",
                          fontWeight: 700,
                          cursor: applyingId === job.id ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => { if (applyingId !== job.id) e.currentTarget.style.background = "rgba(16, 185, 129, 0.2)"; }}
                        onMouseLeave={(e) => { if (applyingId !== job.id) e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)"; }}
                      >
                        {applyingId === job.id ? (
                          <Loader2 size={16} className="spin" />
                        ) : (
                          <Zap size={16} />
                        )}
                        Quick Apply
                      </button>
                      <button
                        onClick={() => setProposalModal({ isOpen: true, job })}
                        style={{
                          width: "100%",
                          padding: "12px",
                          background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                          border: "none",
                          borderRadius: "12px",
                          color: "#fff",
                          fontWeight: 700,
                          cursor: "pointer",
                          boxShadow: "0 10px 20px rgba(99, 102, 241, 0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <Send size={15} /> Custom Proposal
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => navigate("/chat", { state: { recipientAddress: String(job.client) } })}
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "transparent",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
                      borderRadius: "12px",
                      color: isDark ? "#a78bfa" : "#7c3aed",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Message Client
                  </button>
                </div>
              )}

              <div
                style={{ marginTop: "16px", fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", textAlign: "center" }}
              >
                Job ID: #{job.id} <br />
                Client: {shortenAddr(String(job.client))}
              </div>
            </div>
          </div>
        </motion.div>
      );
    },
    [isDark, walletAddress, navigate, appliedJobIds, applyingId, handleQuickApply]
  );

  /* ─── Render ── */
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "32px", alignItems: "start" }}>
          {/* Sidebar */}
          <SearchFilter filters={filters} setFilters={handleFilterChange} onReset={onReset} />

          {/* Main Content */}
          <div style={{ width: "100%" }}>
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  onClick={() => navigate(-1)}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    padding: "8px",
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ChevronLeft size={20} />
                </button>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h2
                      style={{
                        color: isDark ? "#fff" : "#1a1a2e",
                        fontSize: "1.75rem",
                        fontWeight: 800,
                        margin: 0,
                      }}
                    >
                      Available Opportunities
                    </h2>
                    {/* AI active indicator */}
                    {userSkills.length > 0 && (
                      <span
                        style={{
                          background: "rgba(52,211,153,0.1)",
                          border: "1px solid rgba(52,211,153,0.25)",
                          color: "#34d399",
                          padding: "3px 10px",
                          borderRadius: "20px",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Brain size={11} /> AI Active
                      </span>
                    )}
                    {skillsLoading && (
                      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}>
                        ⟳ Loading AI…
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.45)",
                      fontSize: "0.95rem",
                      marginTop: "4px",
                    }}
                  >
                    {userSkills.length > 0
                      ? `Showing ${filteredJobs.length} jobs · sorted by AI match`
                      : `Showing ${filteredJobs.length} active jobs based on your filters`}
                  </p>
                </div>
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
                  cursor: "pointer",
                }}
              >
                Post a Job
              </button>
            </div>

            {/* No Profile Banner */}
            {!skillsLoading && hasProfile === false && walletAddress && (
              <NoProfileBanner onNavigate={() => navigate("/profile")} />
            )}

            {/* AI Recommended Section */}
            {showAISection && userSkills.length > 0 && !loading && (
              <AIRecommendedSection
                jobs={recommendedJobs}
                userSkills={userSkills}
                onOpenModal={(job) => setProposalModal({ isOpen: true, job })}
              />
            )}

            {/* Job List */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "100px 0" }}>
                <div className="spinner-large" />
                <p style={{ color: "rgba(255,255,255,0.4)", marginTop: "16px" }}>
                  Consulting the blockchain…
                </p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  textAlign: "center",
                  padding: "80px 40px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "20px",
                  border: "1px dashed rgba(255,255,255,0.1)",
                }}
              >
                <div style={{ fontSize: "3rem", marginBottom: "20px" }}>🕵️‍♂️</div>
                <h3 style={{ color: "#fff", margin: "0 0 10px" }}>No matching jobs found</h3>
                <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "24px" }}>
                  Try broadening your search criteria or resetting filters.
                </p>
                <button
                  onClick={onReset}
                  style={{
                    background: "#6366f1",
                    color: "#fff",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "10px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
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
              width: 48px; height: 48px;
              border: 4px solid rgba(99,102,241,0.1);
              border-top: 4px solid #6366f1;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
            .spin { animation: spin 1s linear infinite; }
            @media (max-width: 992px) {
              div[style*="grid-template-columns: 300px 1fr"] {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClear={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <ProposalModal
        isOpen={proposalModal.isOpen}
        onClose={() => setProposalModal({ isOpen: false, job: null })}
        job={proposalModal.job}
        walletAddress={walletAddress}
      />
    </>
  );
}
