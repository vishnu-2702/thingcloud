import React, { useMemo } from 'react';

/**
 * Table Widget
 * Displays telemetry data in a tabular format
 */
const TableWidget = ({ 
  data = [], 
  columns = [], // Array of { key, label, unit, format }
  title,
  maxRows = 10,
  showTimestamp = true,
  striped = true,
  compact = false
}) => {
  // Format data for table display
  const tableData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    return data.slice(0, maxRows).map((item, index) => {
      const row = { _index: index };
      
      if (typeof item === 'object') {
        // Handle nested data structure
        const sourceData = item.data || item;
        
        columns.forEach(col => {
          row[col.key] = sourceData[col.key] !== undefined ? sourceData[col.key] : '-';
        });
        
        if (showTimestamp) {
          row._timestamp = item.timestamp || item.time || item.createdAt;
        }
      }
      
      return row;
    });
  }, [data, columns, maxRows, showTimestamp]);

  // Format value based on column configuration
  const formatValue = (value, column) => {
    if (value === undefined || value === null || value === '-') return '-';
    
    if (column.format === 'number' && typeof value === 'number') {
      return value.toFixed(column.decimals ?? 2);
    }
    
    if (column.format === 'boolean') {
      return value ? '✓' : '✗';
    }
    
    if (column.format === 'percentage') {
      return `${(value * 100).toFixed(1)}%`;
    }
    
    return String(value);
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    try {
      return new Date(timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  // Auto-generate columns from data if not provided
  const effectiveColumns = useMemo(() => {
    if (columns.length > 0) return columns;
    
    // Try to infer columns from first data item
    if (tableData.length > 0) {
      const firstItem = tableData[0];
      return Object.keys(firstItem)
        .filter(key => !key.startsWith('_'))
        .map(key => ({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
          format: typeof firstItem[key] === 'number' ? 'number' : 'text'
        }));
    }
    
    return [];
  }, [columns, tableData]);

  if (effectiveColumns.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-neutral-400 dark:text-neutral-500">
        <p className="text-sm">No columns configured</p>
        <p className="text-xs mt-1">Add columns in widget settings</p>
      </div>
    );
  }

  if (tableData.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-neutral-400 dark:text-neutral-500">
        <p className="text-sm">No data available</p>
        <p className="text-xs mt-1">Waiting for telemetry...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {title && (
        <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {title}
          </span>
        </div>
      )}
      
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-800">
            <tr>
              {showTimestamp && (
                <th className={`text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider ${compact ? 'px-2 py-1' : 'px-3 py-2'}`}>
                  Time
                </th>
              )}
              {effectiveColumns.map(col => (
                <th 
                  key={col.key}
                  className={`text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider ${compact ? 'px-2 py-1' : 'px-3 py-2'}`}
                >
                  {col.label || col.key}
                  {col.unit && <span className="ml-1 font-normal">({col.unit})</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {tableData.map((row, idx) => (
              <tr 
                key={row._index}
                className={`
                  ${striped && idx % 2 === 0 ? 'bg-white dark:bg-neutral-900' : 'bg-neutral-50 dark:bg-neutral-800'}
                  hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors
                `}
              >
                {showTimestamp && (
                  <td className={`whitespace-nowrap text-neutral-500 dark:text-neutral-400 ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'}`}>
                    {formatTimestamp(row._timestamp)}
                  </td>
                )}
                {effectiveColumns.map(col => (
                  <td 
                    key={col.key}
                    className={`whitespace-nowrap text-neutral-900 dark:text-white ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'}`}
                  >
                    {formatValue(row[col.key], col)}
                    {col.unit && row[col.key] !== '-' && (
                      <span className="ml-1 text-neutral-400 text-xs">{col.unit}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {tableData.length >= maxRows && (
        <div className="px-3 py-1 text-xs text-neutral-400 dark:text-neutral-500 text-center border-t border-neutral-200 dark:border-neutral-700">
          Showing last {maxRows} entries
        </div>
      )}
    </div>
  );
};

export default TableWidget;
