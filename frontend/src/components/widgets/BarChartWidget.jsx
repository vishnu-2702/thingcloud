// ============================================================================
// WIDGET: BAR CHART
// ============================================================================
import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';

const BarChartWidget = ({ data, dataKey, config = {} }) => {
  const { 
    label = 'Bar Chart',
    color = '#3b82f6',
    maxBars = 12,
    showValues = false,
    showLatest = true,
    decimals = 1
  } = config;
  
  const values = useMemo(() => {
    return (data || []).slice(0, maxBars)
      .map(d => ({ value: d.data?.[dataKey], timestamp: d.timestamp }))
      .filter(v => typeof v.value === 'number')
      .reverse();
  }, [data, dataKey, maxBars]);
  
  if (values.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 text-sm p-3">
        <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-2">
          <BarChart3 size={22} className="opacity-50" />
        </div>
        <span className="text-xs font-medium">No data available</span>
        <span className="text-[10px] text-neutral-400 dark:text-neutral-600 mt-0.5">Waiting for datapoints</span>
      </div>
    );
  }
  
  const max = Math.max(...values.map(v => v.value));
  const min = Math.min(...values.map(v => v.value));
  const latest = values[values.length - 1]?.value;
  const avg = values.reduce((acc, v) => acc + v.value, 0) / values.length;

  // Generate gradient colors based on value
  const getBarColor = (value, index) => {
    const opacity = 0.6 + (index / values.length) * 0.4;
    return { backgroundColor: color, opacity };
  };

  return (
    <div className="h-full w-full flex flex-col p-3 bg-gradient-to-br from-transparent to-neutral-50/50 dark:to-neutral-800/30 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider truncate">
          {label}
        </span>
        {showLatest && latest !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">Latest:</span>
            <span className="text-sm font-bold tabular-nums" style={{ color }}>
              {latest.toFixed(decimals)}
            </span>
          </div>
        )}
      </div>
      
      {/* Chart Container */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Bars */}
        <div className="flex-1 flex items-end gap-[3px] px-1">
          {values.map((v, i) => {
            const height = Math.max((v.value / max) * 100, 4);
            const { opacity } = getBarColor(v.value, i);
            const isLatest = i === values.length - 1;
            
            return (
              <div 
                key={i}
                className="relative flex-1 group"
                style={{ height: '100%' }}
              >
                {/* Bar */}
                <div 
                  className={`absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-300 ${
                    isLatest ? 'ring-2 ring-offset-1 ring-offset-white dark:ring-offset-neutral-900' : ''
                  }`}
                  style={{ 
                    height: `${height}%`,
                    backgroundColor: color,
                    opacity,
                    boxShadow: isLatest ? `0 0 10px ${color}40` : undefined,
                    ...(isLatest && { ringColor: color })
                  }}
                />
                
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] font-medium px-2 py-1 rounded shadow-lg whitespace-nowrap">
                    {v.value.toFixed(decimals)}
                  </div>
                </div>
                
                {/* Value label */}
                {showValues && height > 20 && (
                  <div 
                    className="absolute left-0 right-0 text-center text-[8px] font-medium text-white/90"
                    style={{ bottom: `${height / 2}%`, transform: 'translateY(50%)' }}
                  >
                    {v.value.toFixed(0)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Stats footer */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-200/50 dark:border-neutral-700/50 text-[10px] text-neutral-400 dark:text-neutral-500">
          <div className="flex items-center gap-3">
            <span>Min: <span className="font-medium text-neutral-600 dark:text-neutral-400">{min.toFixed(decimals)}</span></span>
            <span>Avg: <span className="font-medium text-neutral-600 dark:text-neutral-400">{avg.toFixed(decimals)}</span></span>
            <span>Max: <span className="font-medium text-neutral-600 dark:text-neutral-400">{max.toFixed(decimals)}</span></span>
          </div>
          <span className="tabular-nums">{values.length} pts</span>
        </div>
      </div>
    </div>
  );
};

export default BarChartWidget;
