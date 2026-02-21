import React from 'react';

/**
 * Card Component
 * 
 * A flexible container component with consistent padding, borders, and shadows.
 * Supports header, body, and footer sections for structured content.
 */

const Card = ({ 
  children, 
  className = '', 
  padding = 'md',
  hover = false,
  ...props 
}) => {
  const paddingMap = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 
        border border-gray-200 dark:border-gray-700 
        rounded-xl
        ${hover ? 'hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200' : ''}
        ${paddingMap[padding]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', border = true }) => (
  <div className={`
    ${border ? 'border-b border-gray-100 dark:border-gray-700 pb-4 mb-4' : 'mb-4'}
    ${className}
  `.trim()}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-base font-semibold text-gray-900 dark:text-gray-100 ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '' }) => (
  <p className={`mt-1 text-sm text-gray-500 dark:text-gray-400 ${className}`}>
    {children}
  </p>
);

const CardBody = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '', border = true }) => (
  <div className={`
    ${border ? 'border-t border-gray-100 dark:border-gray-700 pt-4 mt-4' : 'mt-4'}
    ${className}
  `.trim()}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
