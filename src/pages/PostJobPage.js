import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../WalletContext";
import { useEscrow } from "../hooks/useEscrow";
import { useTheme } from "../context/ThemeContext";
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  DollarSign, 
  Target, 
  Calendar,
  AlertCircle,
  X,
  Eye,
  Rocket
} from "lucide-react";

const CATEGORIES = ["AI & Machine Learning", "Web Development", "Mobile Apps", "Design & Creative", "Marketing & SEO", "Other"];
const EXP_LEVELS = ["Entry", "Intermediate", "Expert"];
const JOB_TYPES = ["Fixed", "Hourly"];

export default function PostJobPage() {
  const { userRole } = useWallet();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { loading, handlePostJob, status, statusType } = useEscrow();

  const [step, setStep] = useState(1);
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    category: "Web Development",
    description: "",
    skills: [],
    expLevel: "Intermediate",
    jobType: "Fixed",
    budget: 500,
    deadline: ""
  });

  const [skillInput, setSkillInput] = useState("");

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      if (!formData.skills.includes(skillInput.trim())) {
        setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
      }
      setSkillInput("");
      e.preventDefault();
    }
  };

  const removeSkill = (skill) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  const isFormValid = useMemo(() => {
    return formData.title.trim() && formData.description.trim() && formData.budget > 0;
  }, [formData]);

  const onSubmit = async () => {
    try {
      const success = await handlePostJob(
        formData.title,
        formData.description,
        formData.budget,
        "XLM",
        null // milestones
      );
      if (success) {
        navigate("/my-jobs");
      }
    } catch (e) {
      console.error("Post job failed", e);
    }
  };

  // ── Role Check ─────────────────────────────────────────────────────────
  if (userRole === "freelancer") {
    return (
      <div style={{ padding: "100px 20px", textAlign: "center", color: isDark ? "#fff" : "#1a1a2e" }}>
        <AlertCircle size={64} color="#f87171" style={{ marginBottom: "20px" }} />
        <h2 style={{ fontSize: "2rem", fontWeight: 800 }}>Client Mode Required</h2>
        <p style={{ opacity: 0.6, marginBottom: "32px", maxWidth: "400px", margin: "0 auto 32px" }}>
          You are currently in Freelancer mode. Only clients can post jobs and hire freelancers.
        </p>
        <button 
          onClick={() => navigate("/")}
          style={{ padding: "12px 24px", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", border: "none", borderRadius: "12px", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  const inputStyle = {
    width: "100%", padding: "14px 18px", borderRadius: "12px",
    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.12)",
    color: isDark ? "#fff" : "#1a1a2e", outline: "none", fontSize: "1rem", transition: "all 0.2s"
  };

  const labelStyle = {
    display: "block", fontSize: "0.85rem", fontWeight: 700,
    color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
    marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px"
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
      
      {/* Header */}
      <div style={{ marginBottom: "40px", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff", marginBottom: "12px" }}>Create a New Project</h1>
        <p style={{ color: "rgba(255,255,255,0.5)" }}>Hire world-class talent and secure payments with Escrow</p>
      </div>

      {/* Step Indicator */}
      <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "48px" }}>
        {[1, 2, 3].map((num) => (
          <div key={num} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ 
              width: "36px", height: "36px", borderRadius: "50%", 
              background: step >= num ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "rgba(255,255,255,0.05)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800,
              boxShadow: step === num ? "0 0 20px rgba(124, 58, 237, 0.4)" : "none",
              transition: "all 0.3s"
            }}>
              {step > num ? <CheckCircle2 size={20} /> : num}
            </div>
            <span style={{ 
              fontWeight: 700, fontSize: "0.9rem",
              color: step >= num ? "#fff" : "rgba(255,255,255,0.3)"
            }}>{num === 1 ? "Details" : num === 2 ? "Preview" : "Confirm"}</span>
            {num < 3 && <div style={{ width: "40px", height: "2px", background: "rgba(255,255,255,0.1)" }} />}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: step === 2 ? "1fr" : "1.4fr 1fr", gap: "40px", alignItems: "start" }}>
        
        {/* Left Side: Form */}
        <div style={{ 
          background: "rgba(255,255,255,0.03)", borderRadius: "24px", padding: "32px",
          border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
        }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div style={{ display: "grid", gap: "24px" }}>
                  <div>
                    <label style={labelStyle}>Project Title</label>
                    <input 
                      placeholder="e.g. Build a Web3 Dashboard for Stellar" 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      style={inputStyle} 
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div>
                      <label style={labelStyle}>Category</label>
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        style={{ ...inputStyle, cursor: "pointer" }}
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Experience Level</label>
                      <select 
                        value={formData.expLevel}
                        onChange={(e) => setFormData({...formData, expLevel: e.target.value})}
                        style={{ ...inputStyle, cursor: "pointer" }}
                      >
                        {EXP_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Description</label>
                    <textarea 
                      placeholder="Provide a detailed overview of the project..."
                      rows={6}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      style={{ ...inputStyle, resize: "vertical" }}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Required Skills</label>
                    <div style={{ ...inputStyle, display: "flex", flexWrap: "wrap", gap: "8px", padding: "8px" }}>
                      {formData.skills.map(s => (
                        <span key={s} style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa", padding: "4px 10px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                          {s} <X size={14} style={{ cursor: "pointer" }} onClick={() => removeSkill(s)} />
                        </span>
                      ))}
                      <input 
                        placeholder="Type and press Enter..." 
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleAddSkill}
                        style={{ background: "transparent", border: "none", color: "#fff", outline: "none", flex: 1, minWidth: "120px" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div>
                      <label style={labelStyle}>Job Type</label>
                      <div style={{ display: "flex", gap: "10px" }}>
                        {JOB_TYPES.map(t => (
                          <button 
                            key={t}
                            onClick={() => setFormData({...formData, jobType: t})}
                            style={{ 
                              flex: 1, padding: "12px", borderRadius: "12px", border: "none", fontWeight: 700, cursor: "pointer",
                              background: formData.jobType === t ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "rgba(255,255,255,0.05)",
                              color: formData.jobType === t ? "#fff" : "rgba(255,255,255,0.4)"
                            }}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Project Deadline</label>
                      <div style={{ position: "relative" }}>
                        <input 
                          type="date"
                          value={formData.deadline}
                          onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                          style={{ ...inputStyle, appearance: "none" }}
                        />
                        <Calendar size={18} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", opacity: 0.5 }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "40px", display: "flex", justifyContent: "flex-end" }}>
                  <button 
                    onClick={() => setStep(2)}
                    disabled={!isFormValid}
                    style={{ 
                      padding: "16px 32px", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff", fontWeight: 800,
                      border: "none", borderRadius: "14px", cursor: isFormValid ? "pointer" : "not-allowed",
                      display: "flex", alignItems: "center", gap: "10px", opacity: isFormValid ? 1 : 0.5
                    }}
                  >
                    Next: Review Preview <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={{ maxWidth: "800px", margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                  <h2 style={{ fontSize: "1.8rem", color: "#fff", fontWeight: 800 }}>Live Preview</h2>
                  <p style={{ color: "rgba(255,255,255,0.4)" }}>This is how freelancers will see your project</p>
                </div>
                
                <JobPreviewCard formData={formData} />

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "48px" }}>
                  <button onClick={() => setStep(1)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "14px 28px", borderRadius: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
                    <ChevronLeft size={20} /> Edit Details
                  </button>
                  <button onClick={() => setStep(3)} style={{ padding: "14px 32px", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff", fontWeight: 800, border: "none", borderRadius: "14px", cursor: "pointer" }}>
                    Ready to Post! 🎉
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center" }}>
                <div style={{ padding: "40px", background: "rgba(16,185,129,0.1)", border: "1px dashed rgba(16,185,129,0.4)", borderRadius: "24px", marginBottom: "32px" }}>
                  <Rocket size={48} color="#34d399" style={{ marginBottom: "20px" }} />
                  <h2 style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 800, marginBottom: "12px" }}>Almost There!</h2>
                  <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: "24px" }}>
                    To post this job, you will lock <strong>{formData.budget} XLM</strong> in a secure Soroban Smart Contract. 
                    The funds stay in escrow and are only released when you are happy with the delivery.
                  </p>
                  <div style={{ display: "inline-flex", gap: "24px", padding: "16px 24px", background: "rgba(0,0,0,0.3)", borderRadius: "16px" }}>
                    <div style={{ textAlign: "left" }}>
                      <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>BUDGET</span>
                      <div style={{ color: "#34d399", fontWeight: 800, fontSize: "1.2rem" }}>{formData.budget} XLM</div>
                    </div>
                    <div style={{ width: "1px", background: "rgba(255,255,255,0.1)" }} />
                    <div style={{ textAlign: "left" }}>
                      <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>PLATFORM FEE</span>
                      <div style={{ color: "#fff", fontWeight: 800, fontSize: "1.2rem" }}>0.0 XLM (Beta)</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <button 
                    onClick={onSubmit}
                    disabled={loading}
                    style={{ 
                      padding: "20px", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff", fontWeight: 800,
                      fontSize: "1.1rem", border: "none", borderRadius: "16px", cursor: loading ? "not-allowed" : "pointer",
                      boxShadow: "0 10px 40px rgba(124, 58, 237, 0.4)" 
                    }}
                  >
                    {loading ? "Approving & Locking..." : `Authorize & Post Project`}
                  </button>
                  <button onClick={() => setStep(2)} style={{ color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                    Go Back
                  </button>
                </div>

                {status && (
                  <div style={{ 
                    marginTop: "24px", padding: "12px", borderRadius: "12px", 
                    background: statusType === "error" ? "rgba(239,68,68,0.1)" : "rgba(99,102,241,0.1)",
                    color: statusType === "error" ? "#f87171" : "#a5b4fc",
                    border: `1px solid ${statusType === "error" ? "rgba(239,68,68,0.2)" : "rgba(99,102,241,0.2)"}`
                  }}>
                    {status}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Quick Stats & Budget (Only on Step 1) */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: "24px", padding: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <DollarSign size={24} color="#a78bfa" />
                <h3 style={{ color: "#fff", fontSize: "1.2rem", fontWeight: 800 }}>Project Budget</h3>
              </div>
              
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>{formData.budget} XLM</span>
                  <span style={{ color: "#a78bfa", fontWeight: 800 }}>MAX: 50.0K</span>
                </div>
                <input 
                  type="range" 
                  min="50" max="50000" step="50"
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: Number(e.target.value)})}
                  style={{ width: "100%", height: "6px", accentColor: "#7c3aed", borderRadius: "10px", cursor: "pointer" }}
                />
              </div>

              <div style={{ position: "relative" }}>
                <input 
                  type="number" 
                  value={formData.budget} 
                  onChange={(e) => setFormData({...formData, budget: Number(e.target.value)})}
                  style={{ ...inputStyle, paddingLeft: "44px" }} 
                />
                <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#34d399", fontWeight: 800 }}>XLM</span>
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "24px", padding: "28px" }}>
              <h4 style={{ color: "#fff", fontWeight: 700, marginBottom: "16px" }}>Posting Tips</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                <li style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", display: "flex", gap: "10px" }}>
                  <span style={{ color: "#34d399" }}>✓</span> Keep it clear & concise
                </li>
                <li style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", display: "flex", gap: "10px" }}>
                  <span style={{ color: "#34d399" }}>✓</span> Add at least 3-5 tags
                </li>
                <li style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", display: "flex", gap: "10px" }}>
                  <span style={{ color: "#34d399" }}>✓</span> Set a realistic budget
                </li>
              </ul>
            </div>
            
            <div style={{ padding: "0 10px" }}>
              <button 
                onClick={() => setStep(2)}
                disabled={!isFormValid}
                style={{ 
                  width: "100%", padding: "16px", background: "rgba(255,255,255,0.05)", color: "#fff", 
                  borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)", fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px"
                }}
              >
                <Eye size={18} /> Quick Preview
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function JobPreviewCard({ formData }) {
  return (
    <div style={{ 
      background: "rgba(255,255,255,0.04)", borderRadius: "24px", padding: "40px", 
      border: "1px solid rgba(255,255,255,0.08)", position: "relative", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: "150px", height: "150px", background: "radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)" }} />
      
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <span style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa", padding: "6px 14px", borderRadius: "30px", fontWeight: 800, fontSize: "0.75rem", textTransform: "uppercase" }}>
          {formData.category}
        </span>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", fontWeight: 600 }}>Posted Just Now</div>
      </div>

      <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff", marginBottom: "16px" }}>{formData.title || "Your Project Title Here"}</h2>
      
      <div style={{ display: "flex", gap: "20px", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
          <Clock size={16} color="#fbbf24" /> {formData.jobType}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
          <Target size={16} color="#34d399" /> {formData.expLevel} Level
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
          <DollarSign size={16} color="#818cf8" /> {formData.budget} XLM
        </div>
      </div>

      <div style={{ marginBottom: "32px", fontSize: "1rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
        {formData.description || "Project description will appear here..."}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {formData.skills.map(s => (
          <span key={s} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "6px 14px", borderRadius: "10px", fontSize: "0.8rem", fontWeight: 600 }}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
