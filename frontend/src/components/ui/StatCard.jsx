import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * StatCard Component
 * 
 * A card for displaying key metrics with optional trend indicator.
 * Clean and minimal design for dashboard statistics.
 */

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  trendLabel,
  className = '',
}) => {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-emerald-600 dark:text-emerald-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className={`
      bg-white dark:bg-gray-800 
      border border-gray-200 dark:border-gray-700 
      rounded-xl p-5
      ${className}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
            {title}
          </p>
          
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {value}
            </p>
            {subtitle && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </span>
            )}
          </div>
          
          {(trend || trendValue) && (
            <div className={`mt-2 flex items-center gap-1 text-sm ${getTrendColor()}`}>
              <TrendIcon size={14} />
              <span className="font-medium">{trendValue}</span>
              {trendLabel && (
                <span className="text-gray-500 dark:text-gray-400">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        
        {Icon && (
          <div className="flex-shrink-0 p-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Icon size={20} className="text-gray-600 dark:text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
