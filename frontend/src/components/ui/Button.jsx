import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button Component
 * 
 * A versatile button component with multiple variants, sizes, and states.
 * Follows accessibility guidelines with proper focus states and ARIA attributes.
 */

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm',
  secondary: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-gray-500',
  ghost: 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm',
};

const sizes = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
  xl: 'px-6 py-3 text-base',
};

const iconSizes = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 20,
  xl: 22,
};

const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = `
    inline-flex items-center justify-center
    font-medium rounded-lg
    transition-colors duration-150
    focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const iconSize = iconSizes[size];
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={iconSize} className="animate-spin mr-2" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon size={iconSize} className={children ? 'mr-2' : ''} />
          )}
          {children}
          {Icon && iconPosition === 'right' && (
            <Icon size={iconSize} className={children ? 'ml-2' : ''} />
          )}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
