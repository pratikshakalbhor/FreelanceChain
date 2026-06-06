import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEscrow } from "../hooks/useEscrow";
import { 
  Zap, 
  Settings, 
  Briefcase, 
  Layout, 
  ChevronRight, 
  ArrowLeft
} from "lucide-react";
import GigPackages from "../components/GigPackages";
import "./EscrowPage.css";

export default function EscrowPage({ walletAddress, onJobPosted }) {
  const { loading, handlePostJob, status, statusType } = useEscrow();
  
  // Tabs: 'options', 'custom', 'gig'
  const [activeTab, setActiveTab] = useState("options");

  // Form state for custom job
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const handleCustomSubmit = async () => {
    try {
      const success = await handlePostJob(title, description, amount);
      if (success) {
        setTitle(""); setDescription(""); setAmount("");
        onJobPosted?.();
        setActiveTab("options");
      }
    } catch (e) {}
  };

  const handlePackageSelect = async (pkg) => {
    // Auto-fill and submit or ask for confirmation
    try {
      const success = await handlePostJob(
        pkg.title, 
        `Package: ${pkg.tier}. ${pkg.description}\nIncludes: ${pkg.features.join(", ")}`, 
        pkg.price.toString()
      );
      if (success) {
        onJobPosted?.();
        setActiveTab("options");
      }
    } catch (e) {}
  };

  return (
    <div className="escrow-page-container">
      {/* status banner */}
      <AnimatePresence>
        {status && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`status-banner ${statusType}`}
          >
            {status}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="escrow-page-header">
        {activeTab !== "options" && (
          <button className="back-btn" onClick={() => setActiveTab("options")}>
            <ArrowLeft size={18} /> Back
          </button>
        )}
        <h1 className="escrow-title">Secure Jobs & Gigs</h1>
        <p className="escrow-subtitle">Lock XLM in decentralized escrow for 100% protection</p>
      </div>

      <div className="escrow-content">
        <AnimatePresence mode="wait">
          {activeTab === "options" && (
            <motion.div 
              key="options"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="options-grid-container"
            >
              <div className="option-card" onClick={() => setActiveTab("custom")}>
                <div className="option-icon-wrapper blue">
                  <Briefcase size={32} />
                </div>
                <h3>Post a Custom Job</h3>
                <p>Describe your specific requirements and set your own budget.</p>
                <div className="option-meta">Set custom milestones</div>
                <button className="option-action-btn">Post Job <ChevronRight size={16} /></button>
              </div>

              <div className="option-card featured" onClick={() => setActiveTab("gig")}>
                <div className="featured-tag">Recommended</div>
                <div className="option-icon-wrapper purple">
                  <Zap size={32} />
                </div>
                <h3>Order a Gig Package</h3>
                <p>Choose from pre-defined, high-quality service packages.</p>
                <div className="option-meta">3 Tiers: Basic to Premium</div>
                <button className="option-action-btn">View Packages <ChevronRight size={16} /></button>
              </div>
            </motion.div>
          )}

          {activeTab === "custom" && (
            <motion.div 
              key="custom"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="custom-job-form-container"
            >
              <div className="form-card">
                <div className="form-header">
                  <Settings size={20} />
                  <span>Custom Escrow Configuration</span>
                </div>
                
                <div className="form-field">
                  <label>What do you need help with?</label>
                  <input 
                    placeholder="e.g. FullStack DApp with Soroban"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>Service Description</label>
                  <textarea 
                    placeholder="Provide a detailed list of requirements..."
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-field">
                    <label>Budget (XLM)</label>
                    <div className="input-with-icon">
                      <input 
                        type="number" 
                        placeholder="500"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                      <span>XLM</span>
                    </div>
                  </div>
                </div>

                <div className="platform-protection-card">
                  <div className="protection-icon">
                    <Layout size={24} />
                  </div>
                  <div>
                    <h5>Smart Escrow Protection</h5>
                    <p>Your 500 XLM will be locked in the Stellar contract. You can release it or raise a dispute if work is not delivered.</p>
                  </div>
                </div>

                <button 
                  className={`submit-job-btn ${loading ? 'loading' : ''}`}
                  onClick={handleCustomSubmit}
                  disabled={loading}
                >
                  {loading ? "Approving & Sending..." : "Create Escrow Contract"}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "gig" && (
            <motion.div 
              key="gig"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '8px' }}>Select a Service Package</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>Instant order with pre-negotiated terms and pricing.</p>
              </div>
              
              <GigPackages onSelect={handlePackageSelect} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
