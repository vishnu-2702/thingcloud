// ============================================================================
// WIDGET: SLIDER
// ============================================================================
import React, { useState, useEffect } from 'react';

const SliderWidget = ({ value, config = {}, onCommand }) => {
  const { 
    label = 'Slider',
    min = 0,
    max = 100,
    step = 1,
    color = '#3b82f6',
    dataKey = '',
    showValue = true
  } = config;
  
  const [localValue, setLocalValue] = useState(value || min);
  
  useEffect(() => {
    if (typeof value === 'number') setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const newValue = Number(e.target.value);
    setLocalValue(newValue);
  };

  const handleRelease = () => {
    if (onCommand && dataKey) {
      onCommand(dataKey, localValue);
    }
  };

  const percentage = ((localValue - min) / (max - min)) * 100;

  return (
    <div className="h-full w-full flex flex-col justify-center p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider truncate">
          {label}
        </span>
        {showValue && (
          <span className="text-sm font-bold tabular-nums" style={{ color }}>
            {localValue}
          </span>
        )}
      </div>
      <div className="relative">
        <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all"
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={handleChange}
          onMouseUp={handleRelease}
          onTouchEnd={handleRelease}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={!onCommand}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{min}</span>
        <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{max}</span>
      </div>
    </div>
  );
};

export default SliderWidget;
