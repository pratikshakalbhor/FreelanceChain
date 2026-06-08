import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Breadcrumb = () => {
  const { isDark } = useTheme();
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const breadcrumbStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 0',
    fontSize: '0.85rem',
    color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)',
    fontFamily: "'Inter', sans-serif",
    marginBottom: '16px'
  };

  const itemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'color 0.2s ease',
  };

  const activeItemStyle = {
    color: isDark ? '#a78bfa' : '#6366f1',
    fontWeight: 600
  };

  return (
    <nav style={breadcrumbStyle}>
      <Link to="/" style={itemStyle}>
        <Home size={14} />
        <span>Home</span>
      </Link>

      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const displayName = name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');

        return (
          <React.Fragment key={name}>
            <ChevronRight size={14} style={{ opacity: 0.5 }} />
            {isLast ? (
              <span style={activeItemStyle}>{displayName}</span>
            ) : (
              <Link to={routeTo} style={itemStyle}>
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
