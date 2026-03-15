import React, { useState } from 'react';
import logoImg from '../assets/logo.png';

const Logo = ({ className = "w-8 h-8", showText = false }) => {
  const [useFallback, setUseFallback] = useState(false);

  return (
    <div className={`inline-flex items-center ${showText ? 'flex-col space-y-6' : 'space-x-3'}`}>
      <div className="relative flex items-center justify-center">
        {!useFallback ? (
          <img 
            src={logoImg} 
            alt="DeltaScribe" 
            className={className} 
            onError={() => setUseFallback(true)}
          />
        ) : (
          <svg 
            viewBox="0 0 100 100" 
            className={className}
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Minimalist Delta Fallback */}
            <path 
              d="M50 5L95 85H5L50 5Z" 
              stroke="#10B981" 
              strokeWidth="4" 
              strokeLinejoin="round"
            />
            <path 
              d="M35 60C35 55 40 50 45 50V75C40 75 35 70 35 65V60Z" 
              fill="#0F172A" 
            />
            <path 
              d="M45 50C45 42 60 40 60 50C60 55 50 58 48 62" 
              stroke="#10B981" 
              strokeWidth="8" 
              strokeLinecap="round" 
            />
          </svg>
        )}
      </div>

      {showText && (
        <div className="text-center">
          <h2 className="text-4xl font-[1000] tracking-tighter flex items-center justify-center">
            <span className="text-[#0F172A]">Delta</span>
            <span className="text-[#10B981]">Scribe</span>
          </h2>
          <div className="mt-2 flex items-center justify-center space-x-3">
            <div className="h-[2px] w-6 bg-gradient-to-r from-transparent to-slate-200"></div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] whitespace-nowrap">
              Audit & Compliance Intelligence
            </p>
            <div className="h-[2px] w-6 bg-gradient-to-l from-transparent to-slate-200"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logo;
