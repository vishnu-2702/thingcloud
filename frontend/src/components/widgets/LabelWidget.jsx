// ============================================================================
// WIDGET: LABEL / VALUE DISPLAY
// ============================================================================
import React from 'react';
import { applyConditionalColor } from './constants';

const LabelWidget = ({ value, config = {} }) => {
  const { 
    label = 'Value',
    unit = '',
    fontSize = 'text-3xl',
    textColor = '#ffffff',
    bgColor = 'transparent',
    conditions = [],
    decimals = 2,
    showLabel = true
  } = config;

  const displayValue = typeof value === 'number' 
    ? value.toFixed(decimals) 
    : (value ?? '--');
  const color = applyConditionalColor(value, conditions, textColor);

  return (
    <div 
      className="h-full w-full flex flex-col items-center justify-center p-3 rounded-lg"
      style={{ backgroundColor: bgColor !== 'transparent' ? bgColor : undefined }}
    >
      {showLabel && (
        <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1 truncate max-w-full">
          {label}
        </span>
      )}
      <div className="flex items-baseline gap-1">
        <span className={`${fontSize} font-bold tabular-nums`} style={{ color }}>
          {displayValue}
        </span>
        {unit && <span className="text-sm text-neutral-500 dark:text-neutral-400">{unit}</span>}
      </div>
    </div>
  );
};

export default LabelWidget;
