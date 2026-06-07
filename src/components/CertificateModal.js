import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Award, 
  Download, 
  Share2, 
  ShieldCheck,
  X 
} from "lucide-react";
import html2canvas from "html2canvas";

export default function CertificateModal({ isOpen, onClose, job }) {
  const certificateRef = useRef();

  const handleDownload = async () => {
    if (certificateRef.current) {
      const canvas = await html2canvas(certificateRef.current, {
        backgroundColor: "#0f172a",
        scale: 2
      });
      const link = document.createElement("a");
      link.download = `Certificate-${job.id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  if (!isOpen || !job) return null;

  return (
    <AnimatePresence>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "20px"
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          style={{
            background: "#0f172a",
            borderRadius: "32px",
            border: "1px solid rgba(255,255,255,0.1)",
            width: "100%",
            maxWidth: "850px",
            overflow: "hidden",
            position: "relative"
          }}
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            style={{
              position: "absolute", top: "24px", right: "24px",
              background: "rgba(255,255,255,0.05)", border: "none",
              borderRadius: "50%", padding: "10px", color: "#fff",
              cursor: "pointer", zIndex: 10
            }}
          >
            <X size={20} />
          </button>

          <div style={{ padding: "40px" }}>
            {/* The Actual Certificate to Capture */}
            <div 
              ref={certificateRef}
              style={{
                background: "linear-gradient(135deg, #0f172a, #1e1b4b)",
                padding: "60px",
                borderRadius: "24px",
                border: "8px double rgba(99, 102, 241, 0.2)",
                position: "relative",
                textAlign: "center",
                color: "#fff",
                fontFamily: "'Playfair Display', serif"
              }}
            >
              {/* Background Decoration */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)",
                backgroundSize: "24px 24px"
              }} />

              <Award size={80} color="#6366f1" style={{ marginBottom: "24px", filter: "drop-shadow(0 0 20px rgba(99,102,241,0.5))" }} />
              
              <h1 style={{ fontSize: "2.5rem", fontWeight: 800, margin: "0 0 8px", letterSpacing: "2px", color: "#fff" }}>
                CERTIFICATE
              </h1>
              <h3 style={{ fontSize: "1rem", fontWeight: 400, margin: "0 0 40px", letterSpacing: "4px", color: "rgba(255,255,255,0.5)" }}>
                OF PROJECT COMPLETION
              </h3>

              <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.7)", margin: "0 auto 16px", maxWidth: "500px" }}>
                This is to officially certify that the project
              </p>
              
              <h2 style={{ fontSize: "2rem", color: "#818cf8", margin: "0 0 16px", fontWeight: 700 }}>
                "{job.title}"
              </h2>

              <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.7)", margin: "0 auto 40px", maxWidth: "500px" }}>
                has been successfully completed and secured via the FreelanceChain Escrow protocol on the Stellar Network.
              </p>

              <div style={{ 
                display: "flex", justifyContent: "space-between", alignItems: "flex-end", 
                marginTop: "60px", padding: "0 40px" 
              }}>
                <div style={{ textAlign: "left" }}>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px" }}>Date</div>
                  <div style={{ fontWeight: 600 }}>{new Date().toLocaleDateString()}</div>
                </div>

                {/* Seal */}
                <div style={{ 
                  width: "100px", height: "100px", borderRadius: "50%", 
                  border: "2px solid #6366f1", display: "flex", alignItems: "center", 
                  justifyContent: "center", flexDirection: "column", gap: "4px"
                }}>
                  <ShieldCheck size={32} color="#6366f1" />
                  <div style={{ fontSize: "0.6rem", fontWeight: 800, color: "#6366f1" }}>VERIFIED</div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px" }}>Blockchain ID</div>
                  <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "#6366f1" }}>SC-{job.id.slice(0, 8)}...</div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ 
              marginTop: "32px", display: "flex", justifyContent: "center", gap: "16px" 
            }}>
              <button 
                onClick={handleDownload}
                style={{
                  padding: "14px 28px", borderRadius: "14px", border: "none",
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  color: "#fff", fontWeight: 700, display: "flex", alignItems: "center",
                  gap: "10px", cursor: "pointer", boxShadow: "0 10px 20px rgba(99,102,241,0.3)"
                }}
              >
                <Download size={20} /> Download Certificate
              </button>
              <button 
                style={{
                  padding: "14px 28px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#fff", fontWeight: 700, display: "flex", alignItems: "center",
                  gap: "10px", cursor: "pointer"
                }}
              >
                <Share2 size={20} /> Share to LinkedIn
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
