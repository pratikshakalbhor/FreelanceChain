import React from "react";
import { Check, Minus, Clock, RefreshCcw, ShieldCheck } from "lucide-react";
import "./GigPackages.css";

const DEFAULTS = [
  {
    tier: "Basic",
    title: "Essential Web3 Design",
    price: 150,
    description: "Perfect for personal projects. Includes core UI components and basic theme integration.",
    delivery: 3,
    revisions: 1,
    features: ["Single Page Design", "Responsive Layout", "Basic Theme", "Stellar Wallet Support"],
    checks: [true, true, true, true, false, false]
  },
  {
    tier: "Standard",
    title: "Professional DApp Hub",
    price: 450,
    description: "The most popular choice for startups. Full DApp interface with advanced state management.",
    delivery: 7,
    revisions: 3,
    features: ["Multi-page Design", "Responsive Layout", "Advanced State", "On-chain Integration", "Source Files"],
    checks: [true, true, true, true, true, false],
    recommended: true
  },
  {
    tier: "Premium",
    title: "Full Ecosystem Suite",
    price: 950,
    description: "Enterprise-grade solution. End-to-end development including custom smart contracts.",
    delivery: 14,
    revisions: 10,
    features: ["Full Platform Dev", "Custom Theme", "Contract Audits", "Smart Contract Dev", "Source Files", "Support"],
    checks: [true, true, true, true, true, true]
  }
];

const FEATURES_LIST = [
  "Responsive Mobile UI",
  "Wallet Integration",
  "Advanced Transactions",
  "Dashboard Analytics",
  "Source Code Exports",
  "Post-Launch Support"
];

export default function GigPackages({ onSelect, selectedTier }) {
  return (
    <div className="gig-packages-container">
      <div className="package-cards-grid">
        {DEFAULTS.map((pkg) => (
          <div 
            key={pkg.tier} 
            className={`package-card ${pkg.recommended ? 'recommended' : ''} ${selectedTier === pkg.tier ? 'active' : ''}`}
          >
            {pkg.recommended && <div className="recommended-badge">Best Value</div>}
            
            <div className="package-tier">{pkg.tier}</div>
            <h3 className="package-title">{pkg.title}</h3>
            
            <div className="package-price">
              {pkg.price} <span>XLM</span>
            </div>
            
            <p className="package-description">{pkg.description}</p>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                <Clock size={14} /> {pkg.delivery}-day Delivery
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                <RefreshCcw size={14} /> {pkg.revisions} Revisions
              </div>
            </div>

            <ul className="package-features">
              {pkg.features.slice(0, 4).map((f, i) => (
                <li key={i} className="package-feature-item">
                  <Check size={14} /> {f}
                </li>
              ))}
            </ul>

            <button 
              className="select-package-btn"
              onClick={() => onSelect(pkg)}
            >
              {selectedTier === pkg.tier ? "Selected" : `Get Started`}
            </button>
          </div>
        ))}
      </div>

      <div className="comparison-container">
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck size={20} color="#a78bfa" />
          <h4 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>Compare Packages</h4>
        </div>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Features</th>
              {DEFAULTS.map(p => <th key={p.tier}>{p.tier}</th>)}
            </tr>
          </thead>
          <tbody>
            {FEATURES_LIST.map((feature, idx) => (
              <tr key={idx}>
                <td>{feature}</td>
                {DEFAULTS.map(p => (
                  <td key={p.tier}>
                    {p.checks[idx] ? <Check size={18} className="feature-check" /> : <Minus size={18} className="feature-dash" />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
