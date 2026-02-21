import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

/**
 * EmptyState Component
 * 
 * A consistent empty state pattern with icon, title, description, and optional action.
 * Used when lists, tables, or containers have no data to display.
 */

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No data',
  description,
  action,
  actionLabel,
  onAction,
  className = '',
  compact = false,
}) => {
  return (
    <div className={`
      flex flex-col items-center justify-center text-center
      ${compact ? 'py-8 px-4' : 'py-16 px-6'}
      ${className}
    `}>
      <div className={`
        rounded-full bg-gray-100 dark:bg-gray-700/50
        flex items-center justify-center mb-4
        ${compact ? 'w-12 h-12' : 'w-16 h-16'}
      `}>
        <Icon 
          size={compact ? 24 : 32} 
          className="text-gray-400 dark:text-gray-500" 
          strokeWidth={1.5}
        />
      </div>
      
      <h3 className={`
        font-semibold text-gray-900 dark:text-gray-100
        ${compact ? 'text-sm' : 'text-base'}
      `}>
        {title}
      </h3>
      
      {description && (
        <p className={`
          mt-1 text-gray-500 dark:text-gray-400 max-w-sm
          ${compact ? 'text-xs' : 'text-sm'}
        `}>
          {description}
        </p>
      )}
      
      {(action || (actionLabel && onAction)) && (
        <div className="mt-4">
          {action || (
            <Button 
              variant="primary" 
              size={compact ? 'sm' : 'md'}
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
