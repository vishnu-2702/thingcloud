import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

/**
 * Chart Widget
 * Displays line, area, or bar chart with telemetry history
 */
const ChartWidget = ({ 
  data = [], 
  dataKey,
  type = 'line', // 'line', 'area', 'bar'
  title,
  unit = '',
  color = '#3B82F6',
  showGrid = true,
  showAxis = true,
  animate = true,
  height = '100%'
}) => {
  // Format data for recharts
  const chartData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    
    return data.map((item, index) => {
      // Handle different data formats
      let value;
      let timestamp;

      if (typeof item === 'object') {
        // If it's a telemetry object with nested data
        if (item.data && item.data[dataKey] !== undefined) {
          value = item.data[dataKey];
        } else if (item[dataKey] !== undefined) {
          value = item[dataKey];
        } else if (item.value !== undefined) {
          value = item.value;
        }
        timestamp = item.timestamp || item.time || item.createdAt;
      } else {
        value = item;
      }

      return {
        name: timestamp 
          ? new Date(timestamp).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          : `${index + 1}`,
        value: typeof value === 'number' ? value : parseFloat(value) || 0,
        timestamp
      };
    }).slice(-20).reverse(); // Show last 20 data points, oldest first
  }, [data, dataKey]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 shadow-lg">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
          <p className="text-sm font-semibold text-neutral-900 dark:text-white">
            {payload[0].value?.toFixed(2)}{unit}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 10, left: -20, bottom: 0 }
    };

    switch (type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />}
            {showAxis && (
              <>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }} 
                  axisLine={false}
                  tickLine={false}
                />
              </>
            )}
            <Tooltip content={<CustomTooltip />} />
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${dataKey})`}
              isAnimationActive={animate}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />}
            {showAxis && (
              <>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }} 
                  axisLine={false}
                  tickLine={false}
                />
              </>
            )}
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              fill={color}
              radius={[4, 4, 0, 0]}
              isAnimationActive={animate}
            />
          </BarChart>
        );

      case 'line':
      default:
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />}
            {showAxis && (
              <>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#9CA3AF' }} 
                  axisLine={false}
                  tickLine={false}
                />
              </>
            )}
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={animate}
            />
          </LineChart>
        );
    }
  };

  if (chartData.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-neutral-400 dark:text-neutral-500">
        <p className="text-sm">No data available</p>
        <p className="text-xs mt-1">Waiting for telemetry...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-2">
      {title && (
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 text-center">
          {title}
        </div>
      )}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartWidget;
