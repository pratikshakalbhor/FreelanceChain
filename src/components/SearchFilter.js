import React from "react";
import { Search } from "lucide-react";
import "./SearchFilter.css";

const CATEGORIES = [
  "All Categories",
  "Programming & Tech",
  "AI Services",
  "Graphics & Design",
  "Digital Marketing",
  "Writing",
  "Video & Animation",
  "Music & Audio",
  "Business"
];

const EXPERIENCE_LEVELS = ["Entry", "Intermediate", "Expert"];
const JOB_TYPES = ["Fixed", "Hourly"];

export default function SearchFilter({
  filters,
  setFilters,
  onReset
}) {
  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="search-filter-container">
      {/* Search Header */}
      <div className="filter-group">
        <label className="filter-label">Search Jobs</label>
        <div className="search-input-wrapper">
          <input
            type="text"
            className="filter-search-input"
            placeholder="Title, skills, keyword..."
            value={filters.query}
            onChange={(e) => handleChange("query", e.target.value)}
          />
          <Search size={18} className="search-icon-fixed" />
        </div>
      </div>

      {/* Category */}
      <div className="filter-group">
        <label className="filter-label">Category</label>
        <select 
          className="category-select"
          value={filters.category}
          onChange={(e) => handleChange("category", e.target.value)}
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Budget Slider */}
      <div className="filter-group">
        <label className="filter-label">
          Max Budget <span>{filters.maxBudget} XLM</span>
        </label>
        <div className="budget-slider-container">
          <input
            type="range"
            min="10"
            max="5000"
            step="50"
            className="budget-slider"
            value={filters.maxBudget}
            onChange={(e) => handleChange("maxBudget", parseInt(e.target.value))}
          />
          <div className="budget-range-labels">
            <span>10 XLM</span>
            <span>5000 XLM</span>
          </div>
        </div>
      </div>

      {/* Experience Level */}
      <div className="filter-group">
        <label className="filter-label">Experience Level</label>
        <div className="options-grid">
          {EXPERIENCE_LEVELS.map(level => (
            <button
              key={level}
              className={`option-btn ${filters.experienceLevel === level ? 'active' : ''}`}
              onClick={() => handleChange("experienceLevel", 
                filters.experienceLevel === level ? "" : level
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Job Type */}
      <div className="filter-group">
        <label className="filter-label">Job Type</label>
        <div className="options-grid">
          {JOB_TYPES.map(type => (
            <button
              key={type}
              className={`option-btn ${filters.jobType === type ? 'active' : ''}`}
              onClick={() => handleChange("jobType", 
                filters.jobType === type ? "" : type
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Sort By */}
      <div className="filter-group">
        <label className="filter-label">Sort Results</label>
        <select 
          className="sort-select"
          value={filters.sortBy}
          onChange={(e) => handleChange("sortBy", e.target.value)}
        >
          <option value="latest">Latest First</option>
          <option value="budget-high">Budget: High to Low</option>
          <option value="budget-low">Budget: Low to High</option>
        </select>
      </div>

      <button className="reset-filters-btn" onClick={onReset}>
        Reset All Filters
      </button>
    </div>
  );
}
