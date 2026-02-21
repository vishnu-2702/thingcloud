import React, { useState, useEffect } from 'react';
import { Activity, ChevronRight, RefreshCw, Copy, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { deviceAPI } from '../services/deviceAPI';

const TelemetryHistory = ({ deviceId, template }) => {
  const [historyData, setHistoryData] = useState([]);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => {
    fetchHistory();
  }, [deviceId, limit]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await deviceAPI.getTelemetry(deviceId, limit);
      setHistoryData(response.telemetry || []);
    } catch (error) {
      console.error('Error fetching telemetry history:', error);
      toast.error('Failed to load telemetry history');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (index) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  // Extract unique columns from all telemetry data
  const getColumns = () => {
    if (!historyData || historyData.length === 0) return [];
    
    // Collect all unique keys from data objects
    const allKeys = new Set();
    historyData.forEach(entry => {
      if (entry.data) {
        Object.keys(entry.data).forEach(key => allKeys.add(key));
      }
    });

    // Map keys to template datastream names if template is available
    const columns = [];
    allKeys.forEach(key => {
      if (template && template.datastreams) {
        const stream = template.datastreams.find(s => s.virtualPin === key);
        if (stream) {
          columns.push({
            key,
            name: stream.name,
            unit: stream.unit || '',
            dataType: stream.dataType
          });
        } else {
          columns.push({ key, name: key, unit: '', dataType: 'unknown' });
        }
      } else {
        columns.push({ key, name: key, unit: '', dataType: 'unknown' });
      }
    });

    return columns;
  };

  const columns = getColumns();

  const formatTimestamp = (timestamp) => {
    const date = new Date(typeof timestamp === 'number' ? timestamp : timestamp);
    return date.toLocaleString();
  };

  const copyToClipboard = (data) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast.success('Data copied to clipboard');
  };

  const exportData = () => {
    const dataStr = JSON.stringify(historyData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemetry-${deviceId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported');
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Telemetry History</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {historyData.length} records loaded
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-3 py-1.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent"
          >
            <option value={5}>5 records</option>
            <option value={10}>10 records</option>
            <option value={20}>20 records</option>
            <option value={50}>50 records</option>
            <option value={100}>100 records</option>
          </select>
          <button
            onClick={exportData}
            disabled={historyData.length === 0}
            className="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
            title="Export JSON"
          >
            <Download size={16} />
          </button>
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-white rounded-full animate-spin"></div>
        </div>
      ) : historyData && historyData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
                <th className="w-10 px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Timestamp
                </th>
                {columns.map(col => (
                  <th 
                    key={col.key}
                    className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
                  >
                    <div className="flex flex-col">
                      <span>{col.name}</span>
                      {col.unit && (
                        <span className="text-[10px] font-normal text-neutral-400 dark:text-neutral-500 normal-case">
                          ({col.unit})
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="w-20 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {historyData.map((entry, index) => (
                <React.Fragment key={entry.telemetryId || index}>
                  {/* Main Data Row */}
                  <tr 
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                    onClick={() => toggleExpand(index)}
                  >
                    <td className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
                      <div className="flex items-center gap-2">
                        <ChevronRight
                          size={14}
                          className={`text-neutral-400 transition-transform ${
                            expandedRows.has(index) ? 'rotate-90' : ''
                          }`}
                        />
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {formatTimestamp(entry.timestamp).split(',')[0]}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {formatTimestamp(entry.timestamp).split(',')[1]}
                        </span>
                      </div>
                    </td>
                    {columns.map(col => (
                      <td 
                        key={col.key}
                        className="px-4 py-3 text-sm"
                      >
                        <span className="font-semibold text-neutral-900 dark:text-white">
                          {entry.data && entry.data[col.key] !== undefined
                            ? typeof entry.data[col.key] === 'object'
                              ? JSON.stringify(entry.data[col.key])
                              : typeof entry.data[col.key] === 'number'
                                ? entry.data[col.key].toFixed(2)
                                : String(entry.data[col.key])
                            : '-'}
                        </span>
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
                        entry.validated 
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${entry.validated ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        {entry.validated ? 'Valid' : 'Raw'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(entry);
                        }}
                        className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                        title="Copy JSON"
                      >
                        <Copy size={14} />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Row - Full JSON View */}
                  {expandedRows.has(index) && (
                    <tr className="bg-neutral-50 dark:bg-neutral-800/30">
                      <td colSpan={columns.length + 4} className="px-4 py-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                              Raw Data
                            </h4>
                            {entry.telemetryId && (
                              <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 px-2 py-1 bg-neutral-200 dark:bg-neutral-700 rounded">
                                ID: {entry.telemetryId}
                              </span>
                            )}
                          </div>
                          <div className="bg-neutral-900 dark:bg-neutral-950 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-xs text-emerald-400 font-mono">
                              {JSON.stringify(entry, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16">
          <Activity size={48} className="mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No Telemetry History</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Start sending data from your device to see history here
          </p>
        </div>
      )}
    </div>
  );
};

export default TelemetryHistory;
