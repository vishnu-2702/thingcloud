import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Trash2, 
  Search,
  X,
  RefreshCw
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { alertAPI } from '../services/alertAPI';
import toast from 'react-hot-toast';

// Format timestamp to relative or absolute time
const formatTime = (timestamp) => {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { socket, connected } = useSocket();

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    if (socket && connected) {
      socket.on('newAlert', (alertData) => {
        const alertWithCorrectId = {
          ...alertData,
          alertId: alertData.id || alertData.alertId
        };
        setAlerts(prev => {
          const exists = prev.some(a => 
            (a.alertId === alertWithCorrectId.alertId) || 
            (a.id === alertWithCorrectId.id)
          );
          if (exists) return prev;
          return [alertWithCorrectId, ...prev];
        });
        
        if (alertData.severity === 'critical') {
          toast.error(`Critical: ${alertData.message}`);
        } else if (alertData.severity === 'warning') {
          toast(`Warning: ${alertData.message}`, { icon: '⚠️' });
        }
      });

      socket.on('alertResolved', (alertId) => {
        setAlerts(prev => 
          prev.map(alert => 
            (alert.alertId === alertId || alert.id === alertId)
              ? { ...alert, status: 'resolved', resolvedAt: new Date().toISOString() }
              : alert
          )
        );
      });

      return () => {
        socket.off('newAlert');
        socket.off('alertResolved');
      };
    }
  }, [socket, connected]);

  useEffect(() => {
    let pollInterval;
    if (!connected) {
      pollInterval = setInterval(() => fetchAlerts(), 15000);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [connected]);

  const fetchAlerts = async () => {
    try {
      const data = await alertAPI.getAlerts();
      const alertsWithCorrectId = (data.alerts || []).map(alert => ({
        ...alert,
        alertId: alert.id || alert.alertId
      }));
      setAlerts(alertsWithCorrectId);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId) => {
    if (!alertId) return;
    try {
      await alertAPI.markAsRead(alertId);
      setAlerts(prev =>
        prev.map(alert =>
          alert.alertId === alertId ? { ...alert, read: true } : alert
        )
      );
      toast.success('Marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const deleteAlert = async (alertId) => {
    if (!alertId) return;
    try {
      await alertAPI.deleteAlert(alertId);
      setAlerts(prev => prev.filter(alert => alert.alertId !== alertId));
      toast.success('Alert deleted');
    } catch (error) {
      toast.error('Failed to delete alert');
    }
  };

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    }
  };

  const filteredAlerts = alerts
    .filter(alert => {
      if (filter === 'unread') return !alert.read;
      if (filter === 'critical') return alert.severity === 'critical';
      if (filter === 'warning') return alert.severity === 'warning';
      return true;
    })
    .filter(alert =>
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.deviceName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const unreadCount = alerts.filter(alert => !alert.read).length;
  const criticalCount = alerts.filter(alert => alert.severity === 'critical').length;
  const warningCount = alerts.filter(alert => alert.severity === 'warning').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-neutral-300 dark:border-neutral-600 border-t-black dark:border-t-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-white">Alerts</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Monitor device alerts and notifications
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-black dark:text-white bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">Unread</span>
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          </div>
          <p className="text-2xl font-semibold text-black dark:text-white mt-1">{unreadCount}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">Critical</span>
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
          </div>
          <p className="text-2xl font-semibold text-black dark:text-white mt-1">{criticalCount}</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">Warnings</span>
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          </div>
          <p className="text-2xl font-semibold text-black dark:text-white mt-1">{warningCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-black dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="flex gap-2">
          {['all', 'unread', 'critical', 'warning'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === f
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-black dark:text-white mb-1">No alerts found</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {filter === 'all' 
                ? "You don't have any alerts yet."
                : `No ${filter} alerts found.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.alertId}
                className={`p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${
                  !alert.read ? 'bg-neutral-50 dark:bg-neutral-800/30' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.severity)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        alert.severity === 'critical' 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : alert.severity === 'warning'
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      }`}>
                        {alert.severity}
                      </span>
                      {alert.deviceName && (
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {alert.deviceName}
                        </span>
                      )}
                      {!alert.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      )}
                    </div>
                    
                    <p className="text-sm text-black dark:text-white font-medium">
                      {alert.message}
                    </p>
                    
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {formatTime(alert.createdAt)}
                      {alert.resolvedAt && (
                        <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                          • Resolved {formatTime(alert.resolvedAt)}
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!alert.read && (
                      <button
                        onClick={() => markAsRead(alert.alertId)}
                        className="text-xs text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      onClick={() => deleteAlert(alert.alertId)}
                      className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      title="Delete alert"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
