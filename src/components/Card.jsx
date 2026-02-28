import React from 'react';

const Card = ({ children, className = '', animated = true, ...props }) => {
  return (
    <div
      className={`
        bg-gradient-to-br from-slate-900/80 to-slate-900/40 
        backdrop-blur-md
        border border-purple-500/20 
        rounded-2xl 
        p-6 
        shadow-xl 
        shadow-purple-900/20
        transition-all duration-300
        ${animated ? 'hover:border-purple-400/40 hover:shadow-purple-900/40 hover:scale-102' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
