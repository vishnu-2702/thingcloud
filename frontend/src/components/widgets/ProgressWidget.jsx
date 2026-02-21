// ============================================================================
// WIDGET: PROGRESS BAR
// ============================================================================
import React from 'react';
import { applyConditionalColor } from './constants';

const ProgressWidget = ({ value, config = {} }) => {
  const { 
    label = 'Progress',
    min = 0, 
    max = 100, 
    color = '#10b981',
    conditions = [],
    showValue = true,
    orientation = 'horizontal'
  } = config;
  
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : min;
  const percentage = Math.min(Math.max(((safeValue - min) / (max - min)) * 100, 0), 100);
  const appliedColor = applyConditionalColor(value, conditions, color);

  if (orientation === 'vertical') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-2">
        <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2 truncate">
          {label}
        </span>
        <div className="flex-1 w-8 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden relative">
          <div 
            className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-500"
            style={{ height: `${percentage}%`, backgroundColor: appliedColor }}
          />
        </div>
        {showValue && (
          <span className="text-sm font-bold mt-2 tabular-nums" style={{ color: appliedColor }}>
            {typeof value === 'number' ? value.toFixed(0) : '--'}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col justify-center p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider truncate">
          {label}
        </span>
        {showValue && (
          <span className="text-sm font-bold tabular-nums" style={{ color: appliedColor }}>
            {typeof value === 'number' ? value.toFixed(0) : '--'}
          </span>
        )}
      </div>
      <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: appliedColor }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{min}</span>
        <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{max}</span>
      </div>
    </div>
  );
};

export default ProgressWidget;
