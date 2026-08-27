import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', header, footer }) => {
  return (
    <div
      className={`bg-white border border-[#e1e3e5] rounded-xl overflow-hidden ${className}`}
    >
      {header && (
        <div className="px-5 py-3.5 border-b border-[#e1e3e5] bg-white">{header}</div>
      )}
      <div className="px-5 py-4">{children}</div>
      {footer && (
        <div className="px-5 py-3.5 border-t border-[#e1e3e5] bg-[#f6f6f7]">
          {footer}
        </div>
      )}
    </div>
  );
};
