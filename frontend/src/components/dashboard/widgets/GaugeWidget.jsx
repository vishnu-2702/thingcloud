import React, { useMemo } from 'react';

/**
 * Gauge Widget
 * Displays a circular gauge with value
 */
const GaugeWidget = ({ 
  value, 
  min = 0, 
  max = 100, 
  title,
  unit = '',
  decimals = 1,
  color = '#3B82F6',
  warningThreshold = null,
  criticalThreshold = null,
  size = 'medium'
}) => {
  // Calculate percentage
  const percentage = useMemo(() => {
    if (value === null || value === undefined) return 0;
    const numValue = Number(value);
    if (isNaN(numValue)) return 0;
    return Math.min(100, Math.max(0, ((numValue - min) / (max - min)) * 100));
  }, [value, min, max]);

  // Format value
  const formattedValue = useMemo(() => {
    if (value === null || value === undefined) return '--';
    if (typeof value === 'number') {
      return value.toFixed(decimals);
    }
    return String(value);
  }, [value, decimals]);

  // Determine color based on thresholds
  const gaugeColor = useMemo(() => {
    const numValue = Number(value);
    if (criticalThreshold !== null && numValue >= criticalThreshold) {
      return '#EF4444'; // Red
    }
    if (warningThreshold !== null && numValue >= warningThreshold) {
      return '#F59E0B'; // Yellow
    }
    return color;
  }, [value, warningThreshold, criticalThreshold, color]);

  const sizeConfig = {
    small: { width: 80, stroke: 6, textSize: 'text-lg' },
    medium: { width: 120, stroke: 8, textSize: 'text-2xl' },
    large: { width: 160, stroke: 10, textSize: 'text-3xl' }
  };

  const config = sizeConfig[size] || sizeConfig.medium;
  const radius = (config.width - config.stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <div className="relative" style={{ width: config.width, height: config.width }}>
        <svg
          className="transform -rotate-90"
          width={config.width}
          height={config.width}
        >
          {/* Background circle */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={config.stroke}
            fill="none"
            className="text-neutral-200 dark:text-neutral-700"
          />
          
          {/* Progress circle */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            stroke={gaugeColor}
            strokeWidth={config.stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        
        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className={`font-bold text-neutral-900 dark:text-white ${config.textSize}`}>
              {formattedValue}
            </span>
            {unit && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400 ml-0.5">
                {unit}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      {title && (
        <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 text-center">
          {title}
        </div>
      )}

      {/* Min/Max labels */}
      <div className="flex justify-between w-full mt-2 text-xs text-neutral-400 dark:text-neutral-500">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
};

export default GaugeWidget;
