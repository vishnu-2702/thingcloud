import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * PageHeader Component
 * 
 * A consistent page header with optional back navigation, title, description, and actions.
 */

const PageHeader = ({
  title,
  description,
  backTo,
  backLabel,
  actions,
  className = '',
  children,
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          {backTo && (
            <Link
              to={backTo}
              className="mt-1 p-2 -ml-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={backLabel || 'Go back'}
            >
              <ArrowLeft size={20} />
            </Link>
          )}
          
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
      
      {children}
    </div>
  );
};

export default PageHeader;
