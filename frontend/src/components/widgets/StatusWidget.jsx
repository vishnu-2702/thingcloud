// ============================================================================
// WIDGET: STATUS INDICATOR
// ============================================================================
import React from 'react';

const StatusWidget = ({ value, config = {} }) => {
  const { 
    label = 'Status',
    onLabel = 'ONLINE',
    offLabel = 'OFFLINE',
    onColor = '#10b981',
    offColor = '#ef4444',
    onValue = 1
  } = config;
  
  const isOn = value === onValue || value === true || value === 1 || value === '1' || value === 'on';

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-2">
      <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2 truncate">
        {label}
      </span>
      <div 
        className="px-4 py-2 rounded-full flex items-center gap-2"
        style={{ backgroundColor: `${isOn ? onColor : offColor}20` }}
      >
        <div 
          className="w-2.5 h-2.5 rounded-full animate-pulse"
          style={{ backgroundColor: isOn ? onColor : offColor }}
        />
        <span className="text-sm font-semibold" style={{ color: isOn ? onColor : offColor }}>
          {isOn ? onLabel : offLabel}
        </span>
      </div>
    </div>
  );
};

export default StatusWidget;
