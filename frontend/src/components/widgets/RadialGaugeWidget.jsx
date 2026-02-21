// ============================================================================
// WIDGET: RADIAL GAUGE (Full Circle)
// ============================================================================
import React from 'react';
import { applyConditionalColor } from './constants';

const RadialGaugeWidget = ({ value, config = {} }) => {
  const { 
    label = 'Radial',
    min = 0, 
    max = 100, 
    unit = '', 
    color = '#3b82f6',
    conditions = [],
    decimals = 0
  } = config;
  
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : min;
  const percentage = Math.min(Math.max(((safeValue - min) / (max - min)) * 100, 0), 100);
  const appliedColor = applyConditionalColor(value, conditions, color);
  
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-2">
      <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1 truncate">
        {label}
      </span>
      <div className="relative flex-1 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full max-w-[100px]">
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-neutral-200 dark:text-neutral-700"
          />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={appliedColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-neutral-900 dark:text-white tabular-nums">
            {typeof value === 'number' ? value.toFixed(decimals) : '--'}
          </span>
          {unit && <span className="text-[10px] text-neutral-500 dark:text-neutral-400">{unit}</span>}
        </div>
      </div>
    </div>
  );
};

export default RadialGaugeWidget;
