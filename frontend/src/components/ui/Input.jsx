import React from 'react';

/**
 * Input Component
 * 
 * A styled text input with label, helper text, and error states.
 * Follows accessibility guidelines with proper labeling and ARIA attributes.
 */

const Input = React.forwardRef(({
  label,
  error,
  helperText,
  id,
  className = '',
  inputClassName = '',
  required = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseInputStyles = `
    block w-full rounded-lg
    text-sm text-gray-900 dark:text-gray-100
    bg-white dark:bg-gray-800
    border transition-colors duration-150
    placeholder:text-gray-400 dark:placeholder:text-gray-500
    focus:outline-none focus:ring-2 focus:ring-offset-0
    disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60
  `;

  const stateStyles = error
    ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500/20'
    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20';

  const paddingStyles = Icon
    ? iconPosition === 'left' ? 'pl-10 pr-4 py-2.5' : 'pl-4 pr-10 py-2.5'
    : 'px-4 py-2.5';

  return (
    <div className={className}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className={`
            absolute top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500
            ${iconPosition === 'left' ? 'left-3' : 'right-3'}
          `}>
            <Icon size={18} />
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error || helperText ? `${inputId}-description` : undefined}
          className={`
            ${baseInputStyles}
            ${stateStyles}
            ${paddingStyles}
            ${inputClassName}
          `.trim().replace(/\s+/g, ' ')}
          {...props}
        />
      </div>

      {(error || helperText) && (
        <p 
          id={`${inputId}-description`}
          className={`mt-1.5 text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
