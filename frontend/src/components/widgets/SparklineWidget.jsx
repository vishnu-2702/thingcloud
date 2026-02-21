// ============================================================================
// WIDGET: SPARKLINE CHART
// ============================================================================
import React, { useMemo } from 'react';
import { LineChart } from 'lucide-react';

const SparklineWidget = ({ data, dataKey, config = {} }) => {
  const { 
    label = 'Chart',
    color = '#10b981',
    showArea = true,
    showDots = false,
    showLatestValue = true,
    decimals = 1
  } = config;
  
  const values = useMemo(() => {
    return (data || []).slice(0, 50)
      .map(d => d.data?.[dataKey])
      .filter(v => typeof v === 'number')
      .reverse();
  }, [data, dataKey]);
  
  if (values.length < 2) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 p-3">
        <LineChart size={24} className="mb-2 opacity-50" />
        <span className="text-xs">Collecting data...</span>
      </div>
    );
  }
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const latest = values[values.length - 1];
  
  // Build simple polyline points
  const polylinePoints = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 95 - ((v - min) / range) * 85;
    return `${x},${y}`;
  }).join(' ');
  
  // Area polygon points
  const areaPoints = `0,95 ${polylinePoints} 100,95`;

  return (
    <div className="h-full w-full flex flex-col p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider truncate">
          {label}
        </span>
        {showLatestValue && (
          <span className="text-sm font-bold tabular-nums" style={{ color }}>
            {latest.toFixed(decimals)}
          </span>
        )}
      </div>
      
      {/* Chart */}
      <div className="flex-1 min-h-0">
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          {/* Area fill */}
          {showArea && (
            <polygon 
              points={areaPoints}
              fill={color}
              fillOpacity="0.1"
            />
          )}
          
          {/* Main line */}
          <polyline 
            points={polylinePoints}
            fill="none" 
            stroke={color} 
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
          
          {/* Data point dots */}
          {showDots && values.map((v, i) => {
            const x = (i / (values.length - 1)) * 100;
            const y = 95 - ((v - min) / range) * 85;
            return (
              <circle 
                key={i} 
                cx={x} 
                cy={y} 
                r="0.5" 
                fill={color}
              />
            );
          })}
        </svg>
      </div>
      
      {/* Min/Max footer */}
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-neutral-400 dark:text-neutral-500 tabular-nums">
          {min.toFixed(decimals)}
        </span>
        <span className="text-[9px] text-neutral-400 dark:text-neutral-500 tabular-nums">
          {max.toFixed(decimals)}
        </span>
      </div>
    </div>
  );
};

export default SparklineWidget;
