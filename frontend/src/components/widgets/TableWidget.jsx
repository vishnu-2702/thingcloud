// ============================================================================
// WIDGET: DATA TABLE
// ============================================================================
import React, { useState } from 'react';
import { Table, ChevronDown } from 'lucide-react';

const TableWidget = ({ data, config = {} }) => {
  const { 
    label = 'Data Table',
    columns = [],
    maxRows = 10,
    showTimestamp = true
  } = config;
  
  const [displayRows, setDisplayRows] = useState(maxRows);
  const [showRowSelector, setShowRowSelector] = useState(false);
  
  const rowOptions = [5, 10, 15, 20, 25, 50];
  const rows = (data || []).slice(0, displayRows);
  
  if (columns.length === 0 || rows.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 text-sm p-3">
        <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-2">
          <Table size={22} className="opacity-50" />
        </div>
        <span className="text-xs font-medium">
          {columns.length === 0 ? 'Configure columns' : 'No data available'}
        </span>
        <span className="text-[10px] text-neutral-400 dark:text-neutral-600 mt-0.5">
          {columns.length === 0 ? 'Select data columns in settings' : 'Waiting for datapoints'}
        </span>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col p-2 overflow-hidden bg-gradient-to-br from-transparent to-neutral-50/50 dark:to-neutral-800/30 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider truncate">
          {label}
        </span>
        
        {/* Row count selector */}
        <div className="relative">
          <button
            onClick={() => setShowRowSelector(!showRowSelector)}
            className="flex items-center gap-1 text-[10px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md transition-colors"
          >
            <span>{displayRows} rows</span>
            <ChevronDown size={12} className={`transition-transform ${showRowSelector ? 'rotate-180' : ''}`} />
          </button>
          
          {showRowSelector && (
            <>
              <div 
                className="fixed inset-0" 
                style={{ zIndex: 10 }}
                onClick={() => setShowRowSelector(false)} 
                onWheel={() => setShowRowSelector(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 z-20 min-w-[80px]">
                {rowOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setDisplayRows(opt); setShowRowSelector(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      displayRows === opt 
                        ? 'bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-white font-medium' 
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
                    }`}
                  >
                    {opt} rows
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Table */}
      <div className="flex-1 overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-neutral-100 dark:bg-neutral-800">
            <tr>
              {showTimestamp && (
                <th className="text-left py-2 px-2 text-neutral-600 dark:text-neutral-400 font-semibold border-b border-neutral-200 dark:border-neutral-700">
                  Time
                </th>
              )}
              {columns.map(col => (
                <th key={col} className="text-right py-2 px-2 text-neutral-600 dark:text-neutral-400 font-semibold truncate border-b border-neutral-200 dark:border-neutral-700">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr 
                key={i} 
                className={`border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${
                  i === 0 ? 'bg-neutral-50/50 dark:bg-neutral-800/30' : ''
                }`}
              >
                {showTimestamp && (
                  <td className="py-2 px-2 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                    {new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                )}
                {columns.map(col => (
                  <td key={col} className="text-right py-2 px-2 text-neutral-900 dark:text-white font-medium tabular-nums">
                    {typeof row.data?.[col] === 'number' ? row.data[col].toFixed(1) : row.data?.[col] ?? '--'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-neutral-400 dark:text-neutral-500">
        <span>{rows.length} records</span>
        {rows.length > 0 && (
          <span className="tabular-nums">
            Latest: {new Date(rows[0]?.timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
};

export default TableWidget;
