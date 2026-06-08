import React, { useState, useEffect } from "react";
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
  ArrowRight,
  LayoutGrid,
  Code2,
  Palette,
  Megaphone,
  FileText,
  VideoIcon,
  Music2,
  Briefcase,
  ChevronLeft
} from "lucide-react";
import "./CategoriesPage.css";
import { useEscrow } from "../hooks/useEscrow";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SUPPORTED_TOKENS } from "../constants";


const CATEGORIES = [
  { id: 'all', name: "All Categories", icon: <LayoutGrid size={18} /> },
  { id: 1, name: "Programming & Tech", icon: <Zap size={18} /> },
  { id: 2, name: "AI Services", icon: <Brain size={18} /> },
  { id: 3, name: "Graphics & Design", icon: <Layout size={18} /> },
  { id: 4, name: "Digital Marketing", icon: <Globe size={18} /> },
  { id: 5, name: "Writing", icon: <PenTool size={18} /> },
  { id: 6, name: "Video & Animation", icon: <Video size={18} /> },
  { id: 7, name: "Music & Audio", icon: <Music size={18} /> },
  { id: 8, name: "Business", icon: <BarChart size={18} /> },
];

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { jobs, loading } = useEscrow();
  
  const categoryParam = searchParams.get('category') || "All Categories";
  const [activeCategory, setActiveCategory] = useState(categoryParam);

  // Sync state with URL
  useEffect(() => {
    setActiveCategory(categoryParam);
    document.title = `${categoryParam} | Explore Markets`;
  }, [categoryParam]);

  const handleCategoryChange = (catName) => {
    setActiveCategory(catName);
    if (catName === "All Categories") {
      setSearchParams({});
    } else {
      setSearchParams({ category: catName });
    }
  };

  // Filter jobs by category
  const filteredJobs = jobs.filter(job => {
    if (activeCategory === "All Categories") return true;
    
    // In our simplified system, we'll map job titles/descriptions to categories 
    const num = Number(job.id) || 0;
    const cat = CATEGORIES.find(c => c.id !== 'all' && (num % (CATEGORIES.length-1)) === (Number(c.id)-1))?.name;
    return cat === activeCategory;
  });

  const getJobToken = (job) => {
    return SUPPORTED_TOKENS.find(t => t.contract === String(job.token)) || SUPPORTED_TOKENS[0];
  };

  return (
    <div className="categories-page">


      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            padding: '8px',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Explore Markets</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Browse services by professional category</p>
        </div>
      </div>

      {/* Horizontal Scroll Categories */}
      <div className="categories-tabs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`category-tab ${activeCategory === cat.name ? 'active' : ''}`}
            onClick={() => handleCategoryChange(cat.name)}
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
          {loading ? (
            <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', gridColumn: '1/-1', padding: '40px' }}>Loading real-time market data...</div>
          ) : filteredJobs.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', gridColumn: '1/-1', padding: '40px' }}>No active jobs in this category right now.</div>
          ) : filteredJobs.map((job, index) => {
            const token = getJobToken(job);
            
            // Map icons for professional look
            const iconMap = {
              "Programming & Tech": <Code2 size={48} />,
              "AI Services": <Brain size={48} />,
              "Graphics & Design": <Palette size={48} />,
              "Digital Marketing": <Megaphone size={48} />,
              "Writing": <FileText size={48} />,
              "Video & Animation": <VideoIcon size={48} />,
              "Music & Audio": <Music2 size={48} />,
              "Business": <Briefcase size={48} />,
              "default": <LayoutGrid size={48} />
            };

            const num = Number(job.id) || 0;
            const jobCategory = CATEGORIES.find(c => c.id !== 'all' && (num % (CATEGORIES.length-1)) === (Number(c.id)-1))?.name || "default";
            const CategoryIcon = iconMap[jobCategory] || iconMap.default;
            const colorPalette = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
            const accentColor = colorPalette[index % colorPalette.length];

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                key={job.id}
                className="service-card"
                onClick={() => navigate(`/find-jobs?category=${encodeURIComponent(jobCategory === "default" ? activeCategory : jobCategory)}`)}
              >
                <div className="service-image-container" style={{ 
                  background: `radial-gradient(circle at center, ${accentColor}15, #0f172a)`,
                  borderBottom: `1px solid ${accentColor}20`
                }}>
                  <div style={{ 
                    color: accentColor, 
                    filter: `drop-shadow(0 0 15px ${accentColor}40)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '80px',
                    height: '80px',
                    borderRadius: '20px',
                    background: `rgba(255, 255, 255, 0.03)`,
                    border: `1px solid ${accentColor}30`,
                    backdropFilter: 'blur(10px)'
                  }}>
                    {CategoryIcon}
                  </div>
                  <div className="service-badge" style={{ borderColor: `${accentColor}40` }}>Escrow Secured</div>
                </div>
                <div className="service-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginBottom: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: accentColor }} />
                    {jobCategory === "default" ? activeCategory : jobCategory}
                  </div>
                  <h4 className="service-title">{job.title}</h4>
                  <div className="service-footer">
                    <div>
                      <div className="starting-at">Project Budget</div>
                      <div className="price-tag">{(Number(job.amount) / 10_000_000).toFixed(0)} <span>{token.symbol}</span></div>
                    </div>
                    <button style={{ 
                      background: `${accentColor}15`, 
                      border: `1px solid ${accentColor}30`, 
                      color: accentColor, 
                      padding: '8px 16px', 
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}>
                      View Job
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
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
