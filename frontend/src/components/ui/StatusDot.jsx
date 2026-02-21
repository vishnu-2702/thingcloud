import React from 'react';

/**
 * StatusDot Component
 * 
 * A small colored indicator for showing online/offline or status states.
 */

const variants = {
  online: 'bg-emerald-500',
  offline: 'bg-gray-400 dark:bg-gray-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
};

const sizes = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

const StatusDot = ({ 
  status = 'offline', 
  size = 'md',
  pulse = false,
  className = '',
}) => {
  return (
    <span className={`relative inline-flex ${className}`}>
      <span 
        className={`
          rounded-full
          ${variants[status] || variants.offline}
          ${sizes[size]}
        `}
      />
      {pulse && status === 'online' && (
        <span 
          className={`
            absolute inline-flex rounded-full opacity-75 animate-ping
            ${variants[status]}
            ${sizes[size]}
          `}
        />
      )}
    </span>
  );
};

export default StatusDot;
