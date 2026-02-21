import React from 'react';
import { CheckCircle, XCircle, AlertCircle, HelpCircle } from 'lucide-react';

/**
 * Status Indicator Widget
 * Displays on/off or active/inactive status with visual indicator
 */
const StatusIndicatorWidget = ({ 
  value, 
  title,
  showLabel = true,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
  activeColor = '#22C55E',
  inactiveColor = '#6B7280',
  pulseWhenActive = true,
  size = 'medium'
}) => {
  // Determine if active
  const isActive = value === true || 
                   value === 1 || 
                   value === '1' || 
                   String(value).toLowerCase() === 'true' || 
                   String(value).toLowerCase() === 'on' ||
                   String(value).toLowerCase() === 'active';

  const isUnknown = value === null || value === undefined;

  const sizeConfig = {
    small: { indicator: 'w-8 h-8', dot: 'w-4 h-4', text: 'text-xs' },
    medium: { indicator: 'w-12 h-12', dot: 'w-6 h-6', text: 'text-sm' },
    large: { indicator: 'w-16 h-16', dot: 'w-8 h-8', text: 'text-base' }
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  if (isUnknown) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div className={`${config.indicator} rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center`}>
          <HelpCircle className="text-neutral-400" size={24} />
        </div>
        {showLabel && (
          <div className={`${config.text} text-neutral-500 dark:text-neutral-400 mt-2`}>
            Unknown
          </div>
        )}
        {title && (
          <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            {title}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <div 
        className={`${config.indicator} rounded-full flex items-center justify-center transition-colors`}
        style={{ 
          backgroundColor: isActive 
            ? `${activeColor}20` 
            : `${inactiveColor}20` 
        }}
      >
        <div 
          className={`${config.dot} rounded-full transition-all ${
            isActive && pulseWhenActive ? 'animate-pulse' : ''
          }`}
          style={{ backgroundColor: isActive ? activeColor : inactiveColor }}
        />
      </div>

      {showLabel && (
        <div 
          className={`${config.text} font-medium mt-2 transition-colors`}
          style={{ color: isActive ? activeColor : inactiveColor }}
        >
          {isActive ? activeLabel : inactiveLabel}
        </div>
      )}

      {title && (
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 text-center">
          {title}
        </div>
      )}
    </div>
  );
};

export default StatusIndicatorWidget;
