import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showText = true }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Custom Interlocking Roof & Chain Link Emblem */}
      <div className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl bg-[#146C5A] text-white shadow-md shadow-[#146C5A]/20 transition-transform duration-300 hover:scale-105`}>
        <svg viewBox="0 0 40 40" fill="none" className="w-3/4 h-3/4 stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* House Roof Accent */}
          <path d="M7 20L20 8L33 20" stroke="#E8D8B9" strokeWidth="3" />
          {/* Main House Wall Structure */}
          <path d="M11 18V31C11 32.1 11.9 33 13 33H27C28.1 33 29 32.1 29 31V18" stroke="currentColor" strokeWidth="2.5" />
          {/* Interlocking Link Loop in Accent Gold */}
          <path d="M16 23C16 20.8 17.8 19 20 19C22.2 19 24 20.8 24 23V27C24 29.2 22.2 31 20 31" stroke="#B66A32" strokeWidth="2.5" strokeDasharray="1 0" />
          <path d="M18 25H22" stroke="#E8D8B9" strokeWidth="2.5" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-extrabold tracking-tight ${textSizes[size]} text-[#242424] flex items-center gap-1`}>
            Casa<span className="text-[#146C5A]">Link</span>
          </span>
          <span className="text-[10px] font-semibold tracking-wider text-[#B66A32] uppercase -mt-1">
            Genuine Rental Houses
          </span>
        </div>
      )}
    </div>
  );
};
