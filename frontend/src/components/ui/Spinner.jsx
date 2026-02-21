import React from 'react';

/**
 * Spinner Component
 * 
 * A simple loading indicator with multiple sizes and optional label.
 */

const sizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const Spinner = ({ 
  size = 'md', 
  className = '',
  label,
  center = false,
}) => {
  const spinner = (
    <svg 
      className={`animate-spin text-blue-600 dark:text-blue-400 ${sizes[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  if (center) {
    return (
      <div className="flex flex-col items-center justify-center gap-3" role="status">
        {spinner}
        {label && (
          <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        )}
        <span className="sr-only">{label || 'Loading...'}</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2" role="status">
      {spinner}
      {label && (
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      )}
      <span className="sr-only">{label || 'Loading...'}</span>
    </div>
  );
};

export default Spinner;
