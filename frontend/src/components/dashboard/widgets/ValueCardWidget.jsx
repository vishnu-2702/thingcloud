import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Value Card Widget
 * Displays a single numeric or string value with optional trend indicator
 */
const ValueCardWidget = ({ 
  value, 
  title, 
  unit = '', 
  decimals = 1,
  previousValue = null,
  color = '#3B82F6',
  showTrend = true,
  size = 'medium'
}) => {
  // Format the display value
  const formattedValue = useMemo(() => {
    if (value === null || value === undefined) return '--';
    if (typeof value === 'number') {
      return value.toFixed(decimals);
    }
    if (typeof value === 'boolean') {
      return value ? 'ON' : 'OFF';
    }
    return String(value);
  }, [value, decimals]);

  // Calculate trend
  const trend = useMemo(() => {
    if (!showTrend || previousValue === null || typeof value !== 'number' || typeof previousValue !== 'number') {
      return null;
    }
    const diff = value - previousValue;
    const percentage = previousValue !== 0 ? ((diff / previousValue) * 100).toFixed(1) : 0;
    return {
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
      value: Math.abs(percentage)
    };
  }, [value, previousValue, showTrend]);

  const sizeClasses = {
    small: 'text-2xl',
    medium: 'text-4xl',
    large: 'text-5xl'
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <div className={`font-bold text-neutral-900 dark:text-white ${sizeClasses[size]}`} style={{ color }}>
        {formattedValue}
        {unit && <span className="text-lg text-neutral-500 dark:text-neutral-400 ml-1">{unit}</span>}
      </div>
      
      {title && (
        <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 text-center">
          {title}
        </div>
      )}

      {trend && (
        <div className={`flex items-center mt-2 text-sm ${
          trend.direction === 'up' ? 'text-emerald-600 dark:text-emerald-400' :
          trend.direction === 'down' ? 'text-red-600 dark:text-red-400' :
          'text-neutral-500 dark:text-neutral-400'
        }`}>
          {trend.direction === 'up' && <TrendingUp size={14} className="mr-1" />}
          {trend.direction === 'down' && <TrendingDown size={14} className="mr-1" />}
          {trend.direction === 'stable' && <Minus size={14} className="mr-1" />}
          <span>{trend.value}%</span>
        </div>
      )}
    </div>
  );
};

export default ValueCardWidget;
