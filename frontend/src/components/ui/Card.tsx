import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-[#1a1a1a] border border-[#2a2a2a] rounded-3xl p-8 shadow-xl text-white ${className}`}>
      {title && <h3 className="text-2xl font-semibold mb-6 text-white">{title}</h3>}
      {children}
    </div>
  );
};

export default Card;