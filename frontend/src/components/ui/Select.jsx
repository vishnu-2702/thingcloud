import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Select Component
 * 
 * A styled select dropdown with label and error states.
 * Consistent styling with the Input component.
 */

const Select = React.forwardRef(({
  label,
  error,
  helperText,
  id,
  className = '',
  selectClassName = '',
  required = false,
  disabled = false,
  options = [],
  placeholder = 'Select an option',
  children,
  ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseSelectStyles = `
    block w-full rounded-lg appearance-none
    text-sm text-gray-900 dark:text-gray-100
    bg-white dark:bg-gray-800
    border transition-colors duration-150
    focus:outline-none focus:ring-2 focus:ring-offset-0
    disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60
    px-4 py-2.5 pr-10
  `;

  const stateStyles = error
    ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500/20'
    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20';

  return (
    <div className={className}>
      {label && (
        <label 
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error || helperText ? `${selectId}-description` : undefined}
          className={`
            ${baseSelectStyles}
            ${stateStyles}
            ${selectClassName}
          `.trim().replace(/\s+/g, ' ')}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children || options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronDown size={18} className="text-gray-400 dark:text-gray-500" />
        </div>
      </div>

      {(error || helperText) && (
        <p 
          id={`${selectId}-description`}
          className={`mt-1.5 text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
