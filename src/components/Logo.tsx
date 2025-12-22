import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="6"
          className="text-primary-600" // Uses your primary blue
        />

        {/* Animated S-Curve Flow */}
        <path
          d="M35 70C35 55 65 45 65 30C65 20 55 15 45 20C35 25 35 35 35 35"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary-600 opacity-80"
        />

        {/* The "Life Point" */}
        <circle
          cx="65"
          cy="30"
          r="6"
          fill="currentColor"
          className="text-primary-400" // Uses your lighter blue
        />
      </svg>
    </div>
  );
};
