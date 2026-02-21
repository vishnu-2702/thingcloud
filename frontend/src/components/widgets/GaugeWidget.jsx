// ============================================================================
// WIDGET: GAUGE (Half Circle)
// ============================================================================
import React from 'react';
import { applyConditionalColor } from './constants';

const GaugeWidget = ({ value, config = {} }) => {
  const { 
    label = 'Gauge',
    min = 0, 
    max = 100, 
    unit = '', 
    color = '#10b981',
    conditions = [],
    showMinMax = true,
    decimals = 1
  } = config;
  
  const safeValue = typeof value === 'number' && !isNaN(value) ? value : min;
  const clampedValue = Math.min(Math.max(safeValue, min), max);
  const percentage = ((clampedValue - min) / (max - min)) * 100;
  const appliedColor = applyConditionalColor(value, conditions, color);
  
  // Arc calculation for half circle (180 degrees)
  const radius = 40;
  const strokeWidth = 8;
  const circumference = Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-2">
      <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1 truncate max-w-full">
        {label}
      </span>
      <div className="relative flex-1 flex items-center justify-center min-h-0 w-full">
        <svg viewBox="0 0 100 60" className="w-full h-full max-w-[140px]" preserveAspectRatio="xMidYMid meet">
          {/* Background arc */}
          <path
            d="M 10 55 A 40 40 0 0 1 90 55"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-neutral-200 dark:text-neutral-700"
          />
          {/* Value arc */}
          <path
            d="M 10 55 A 40 40 0 0 1 90 55"
            fill="none"
            stroke={appliedColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
          />
        </svg>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
          <span className="text-xl font-bold text-neutral-900 dark:text-white tabular-nums">
            {typeof value === 'number' ? value.toFixed(decimals) : '--'}
          </span>
          {unit && <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-0.5">{unit}</span>}
        </div>
      </div>
      {showMinMax && (
        <div className="flex justify-between w-full px-2 mt-1">
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{min}</span>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{max}</span>
        </div>
      )}
    </div>
  );
};

export default GaugeWidget;
