import React from 'react';

/**
 * Badge Component
 * 
 * Small status indicators for labels, counts, and states.
 * Supports multiple variants for different semantic meanings.
 */

const variants = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  primary: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  danger: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  info: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
};

const sizes = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-xs',
  lg: 'px-2.5 py-1 text-sm',
};

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  dot = false,
  className = '',
  ...props 
}) => {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {dot && (
        <span 
          className={`
            w-1.5 h-1.5 rounded-full mr-1.5
            ${variant === 'success' ? 'bg-emerald-500' : ''}
            ${variant === 'warning' ? 'bg-amber-500' : ''}
            ${variant === 'danger' ? 'bg-red-500' : ''}
            ${variant === 'info' ? 'bg-sky-500' : ''}
            ${variant === 'primary' ? 'bg-blue-500' : ''}
            ${variant === 'default' ? 'bg-gray-500' : ''}
          `}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
