import React from "react";
import { 
  Code2, 
  BrainCircuit, 
  Palette, 
  Megaphone, 
  PenTool, 
  Video, 
  Music, 
  Briefcase,
  ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./LandingSections.css";

// Import images (assuming they were copied to assets)
import blockchainImg from "../assets/blockchain_dev.png";
import smartContractImg from "../assets/smart_contract.png";
import dappDesignImg from "../assets/dapp_design.png";
import tokenNftImg from "../assets/token_nft.png";
import cryptoMarketingImg from "../assets/crypto_marketing.png";

const CATEGORIES = [
  { name: "Programming & Tech", icon: <Code2 />, color: "#34d399" },
  { name: "AI Services", icon: <BrainCircuit />, color: "#a78bfa" },
  { name: "Graphics & Design", icon: <Palette />, color: "#fb7185" },
  { name: "Digital Marketing", icon: <Megaphone />, color: "#3b82f6" },
  { name: "Writing", icon: <PenTool />, color: "#facc15" },
  { name: "Video & Animation", icon: <Video />, color: "#f472b6" },
  { name: "Music & Audio", icon: <Music />, color: "#c084fc" },
  { name: "Business", icon: <Briefcase />, color: "#60a5fa" }
];

const POPULAR_SERVICES = [
  {
    category: "Programming & Tech",
    title: "Full-Stack Blockchain Development (Solidity/Rust)",
    price: 500,
    image: blockchainImg
  },
  {
    category: "AI Services",
    title: "Custom AI Agent Integration for Web3 Apps",
    price: 350,
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800" // Fallback for failed generation
  },
  {
    category: "Graphics & Design",
    title: "High-Fidelity Web3 UI/UX & DApp Design",
    price: 200,
    image: dappDesignImg
  },
  {
    category: "Security",
    title: "Smart Contract Audit & Security Optimization",
    price: 800,
    image: smartContractImg
  },
  {
    category: "Assets",
    title: "Custom Tokenomics Design & NFT Collection Launch",
    price: 450,
    image: tokenNftImg
  },
  {
    category: "Digital Marketing",
    title: "Strategic Crypto Marketing & Community Growth",
    price: 300,
    image: cryptoMarketingImg
  }
];

export function CategoriesRow() {
  const navigate = useNavigate();

  return (
    <div className="categories-section">
      <div className="categories-scroll-wrapper">
        {CATEGORIES.map((cat, i) => (
          <div 
            key={i} 
            className="category-pill"
            onClick={() => navigate(`/categories?category=${encodeURIComponent(cat.name)}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className="category-icon" style={{ color: cat.color }}>
              {cat.icon}
            </div>
            <span className="category-name">{cat.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PopularServices() {
  const navigate = useNavigate();

  return (
    <div className="popular-services-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 className="popular-title">Popular services</h2>
        <button 
          onClick={() => navigate('/categories')}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: '#a78bfa', 
            fontWeight: 600, 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '28px'
          }}>
          Show all <ChevronRight size={16} />
        </button>
      </div>
      <div className="services-grid">
        {POPULAR_SERVICES.map((service, i) => (
          <div 
            key={i} 
            className="service-card"
            onClick={() => navigate(`/find-jobs?category=${encodeURIComponent(service.category)}`)}
            style={{ cursor: 'pointer' }}
          >
            <div 
              className="service-banner" 
              style={{ backgroundImage: `url(${service.image})` }}
            >
              <span className="service-category-tag">{service.category}</span>
            </div>
            <div className="service-content">
              <h3 className="service-card-title">{service.title}</h3>
              <div className="service-footer">
                <span className="service-price-label">Starting from</span>
                <span className="service-price-value">{service.price} XLM</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
