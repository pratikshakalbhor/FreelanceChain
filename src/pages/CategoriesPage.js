import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  Brain, 
  Layout, 
  Globe, 
  PenTool, 
  Video, 
  Music, 
  BarChart,
  ArrowRight
} from "lucide-react";
import "./CategoriesPage.css";

const CATEGORIES = [
  { id: 1, name: "Programming & Tech", icon: <Zap size={18} /> },
  { id: 2, name: "AI Services", icon: <Brain size={18} /> },
  { id: 3, name: "Graphics & Design", icon: <Layout size={18} /> },
  { id: 4, name: "Digital Marketing", icon: <Globe size={18} /> },
  { id: 5, name: "Writing", icon: <PenTool size={18} /> },
  { id: 6, name: "Video & Animation", icon: <Video size={18} /> },
  { id: 7, name: "Music & Audio", icon: <Music size={18} /> },
  { id: 8, name: "Business", icon: <BarChart size={18} /> },
];

const POPULAR_SERVICES = [
  {
    id: 1,
    title: "Web Development using React & Node JS",
    price: 450,
    category: "Programming & Tech",
    emoji: "💻",
    tag: "High Demand"
  },
  {
    id: 2,
    title: "Custom Logo Design & Brand Identity",
    price: 120,
    category: "Graphics & Design",
    emoji: "🎨",
    tag: "Trending"
  },
  {
    id: 3,
    title: "AI Chatbot Integration & Model Training",
    price: 600,
    category: "AI Services",
    emoji: "🤖",
    tag: "Premium"
  },
  {
    id: 4,
    title: "SEO Optimization & Digital Growth Strategy",
    price: 280,
    category: "Digital Marketing",
    emoji: "🚀",
    tag: "Best Seller"
  },
  {
    id: 5,
    title: "Professional Video Editing & Motion Graphics",
    price: 180,
    category: "Video & Animation",
    emoji: "🎬",
    tag: "Popular"
  },
  {
    id: 6,
    title: "Voice Over Specialist & Audio Production",
    price: 95,
    category: "Music & Audio",
    emoji: "🎤",
    tag: "New"
  }
];

export default function CategoriesPage() {
  const [activeCategory, setActiveCategory] = useState("Programming & Tech");

  return (
    <div className="categories-page">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="services-section-header"
      >
        <h2>Explore Markets</h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
          Find the best talent for your project across various specializations.
        </p>
      </motion.div>

      {/* Horizontal Scroll Categories */}
      <div className="categories-tabs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`category-tab ${activeCategory === cat.name ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.name)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {cat.icon} {cat.name}
            </span>
          </button>
        ))}
      </div>

      {/* Main Grid Section */}
      <div className="services-section-header" style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          Popular Services in {activeCategory} <ArrowRight size={18} color="#6366f1" />
        </h3>
      </div>

      <div className="service-grid">
        <AnimatePresence mode="popLayout">
          {POPULAR_SERVICES.map((service, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              key={service.id}
              className="service-card"
            >
              <div className="service-image-container">
                {service.emoji}
                <div className="service-badge">{service.tag}</div>
              </div>
              <div className="service-content">
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: '8px' }}>
                  {service.category}
                </div>
                <h4 className="service-title">{service.title}</h4>
                <div className="service-footer">
                  <div>
                    <div className="starting-at">Starting At</div>
                    <div className="price-tag">{service.price} <span>XLM</span></div>
                  </div>
                  <button style={{ 
                    background: 'rgba(99, 102, 241, 0.1)', 
                    border: '1px solid rgba(99, 102, 241, 0.2)', 
                    color: '#6366f1', 
                    padding: '8px 16px', 
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}>
                    Order Now
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Stats Section / Fiverr Style extra info */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        style={{ 
          marginTop: '80px', 
          padding: '40px', 
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(167, 139, 250, 0.1))',
          borderRadius: '32px',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          textAlign: 'center'
        }}
      >
        <h2 style={{ color: '#fff', marginBottom: '12px' }}>A whole world of freelance talent at your fingertips</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '700px', margin: '0 auto 32px' }}>
          From logo design and web development to digital marketing and AI services, get your projects done fast with verified pros from the Stellar community.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>10k+</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Verified Freelancers</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>50k+</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Completed Jobs</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>4.8/5</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Customer Satisfaction</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
