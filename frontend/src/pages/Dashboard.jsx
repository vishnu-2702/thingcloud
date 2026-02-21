import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Cpu, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Zap,
  BarChart3,
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wifi,
  WifiOff,
  Database,
  FileCode2,
  Bell,
  RefreshCw,
  ExternalLink,
  Clock,
  Server
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { userAPI } from '../services/userAPI';
import { deviceAPI } from '../services/deviceAPI';
import { alertAPI } from '../services/alertAPI';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalDevices: 0,
    activeDevices: 0,
    offlineDevices: 0,
    totalTemplates: 0,
    todayTelemetry: 0,
    telemetryChangePercent: 0,
    devicesThisWeek: 0
  });
  
  const [devices, setDevices] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  const { connected, socket } = useSocket();

  // Helper function to check if device should be offline based on lastSeen
  const isDeviceOffline = (lastSeen) => {
    if (!lastSeen) return true;
    const OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
    const lastSeenTimestamp = typeof lastSeen === 'string' ? new Date(lastSeen).getTime() : lastSeen;
    return (Date.now() - lastSeenTimestamp) > OFFLINE_THRESHOLD;
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Real-time socket listeners
  useEffect(() => {
    if (socket && connected) {
      socket.on('deviceStatusChanged', (data) => {
        setDevices(prev => {
          const updated = prev.map(device => 
            device.deviceId === data.deviceId 
              ? { ...device, status: data.status, lastSeen: data.lastSeen || Date.now() }
              : device
          );
          updateDeviceCounts(updated);
          return updated;
        });
      });

      socket.on('deviceRegistered', (deviceData) => {
        setDevices(prev => [deviceData, ...prev]);
        setStats(prev => ({
          ...prev,
          totalDevices: prev.totalDevices + 1
        }));
      });

      socket.on('telemetryData', (data) => {
        if (data.deviceId) {
          setDevices(prev => prev.map(device => 
            device.deviceId === data.deviceId
              ? { ...device, lastSeen: Date.now(), status: 'online' }
              : device
          ));
        }
        setStats(prev => ({
          ...prev,
          todayTelemetry: prev.todayTelemetry + 1
        }));
      });

      socket.on('newEvent', (eventData) => {
        setRecentActivity(prev => [eventData, ...prev.slice(0, 9)]);
      });

      return () => {
        socket.off('deviceStatusChanged');
        socket.off('deviceRegistered');
        socket.off('telemetryData');
        socket.off('newEvent');
      };
    } else {
      const pollInterval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(pollInterval);
    }
  }, [socket, connected]);

  const updateDeviceCounts = (deviceList) => {
    const online = deviceList.filter(d => !isDeviceOffline(d.lastSeen) && d.status !== 'offline').length;
    const offline = deviceList.length - online;
    setStats(prev => ({
      ...prev,
      activeDevices: online,
      offlineDevices: offline
    }));
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsData, devicesData, eventsData, alertsData] = await Promise.all([
        userAPI.getStats(),
        deviceAPI.getDevices(),
        userAPI.getEvents(10),
        alertAPI.getAlerts().catch(() => ({ alerts: [] }))
      ]);

      const allDevices = devicesData.devices || [];
      const onlineDevices = allDevices.filter(device => 
        !isDeviceOffline(device.lastSeen) && device.status !== 'offline'
      );
      const offlineDevices = allDevices.length - onlineDevices.length;
      
      setStats({
        totalDevices: statsData.stats.totalDevices || 0,
        activeDevices: onlineDevices.length,
        offlineDevices: offlineDevices,
        totalTemplates: statsData.stats.totalTemplates || 0,
        todayTelemetry: statsData.stats.activeToday || 0,
        telemetryChangePercent: statsData.stats.telemetryChangePercent || 0,
        devicesThisWeek: statsData.stats.devicesThisWeek || 0
      });

      setDevices(allDevices);
      setRecentActivity(eventsData.events || []);
      setAlerts((alertsData.alerts || []).filter(a => !a.read).slice(0, 5));
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Never';
    const diff = Date.now() - new Date(timestamp).getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'device_connected':
        return <Wifi size={14} className="text-emerald-500" />;
      case 'device_disconnected':
        return <WifiOff size={14} className="text-red-500" />;
      case 'telemetry_received':
        return <Database size={14} className="text-blue-500" />;
      case 'alert_triggered':
        return <AlertTriangle size={14} className="text-amber-500" />;
      default:
        return <Activity size={14} className="text-neutral-400" />;
    }
  };

  const getAlertSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-500/10';
      case 'warning': return 'text-amber-500 bg-amber-500/10';
      default: return 'text-blue-500 bg-blue-500/10';
    }
  };

  // Get devices sorted by status (offline first as they need attention)
  const devicesByStatus = [...devices]
    .map(d => ({ ...d, isOffline: isDeviceOffline(d.lastSeen) }))
    .sort((a, b) => {
      if (a.isOffline && !b.isOffline) return -1;
      if (!a.isOffline && b.isOffline) return 1;
      return new Date(b.lastSeen || 0) - new Date(a.lastSeen || 0);
    })
    .slice(0, 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Dashboard</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center gap-1.5 text-xs ${connected ? 'text-emerald-600 dark:text-emerald-500' : 'text-neutral-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`} />
              {connected ? 'Live' : 'Polling'}
            </span>
            <span className="text-neutral-300 dark:text-neutral-600">·</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Updated {formatRelativeTime(lastRefresh)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchDashboardData}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <Link to="/app/devices/register">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
              <Plus size={16} />
              New Device
            </button>
          </Link>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Devices */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Total Devices</span>
            <Cpu size={16} className="text-neutral-400" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-semibold text-neutral-900 dark:text-white">{stats.totalDevices}</span>
            {stats.devicesThisWeek > 0 && (
              <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-500">
                <TrendingUp size={12} />
                +{stats.devicesThisWeek} this week
              </span>
            )}
          </div>
        </div>

        {/* Online/Offline Split */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Device Status</span>
            <Server size={16} className="text-neutral-400" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-lg font-semibold text-neutral-900 dark:text-white">{stats.activeDevices}</span>
              <span className="text-xs text-neutral-500">online</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600" />
              <span className="text-lg font-semibold text-neutral-900 dark:text-white">{stats.offlineDevices}</span>
              <span className="text-xs text-neutral-500">offline</span>
            </div>
          </div>
          <div className="mt-3 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${stats.totalDevices > 0 ? (stats.activeDevices / stats.totalDevices) * 100 : 0}%` }}
            />
            <div 
              className="h-full bg-neutral-300 dark:bg-neutral-600 transition-all duration-500"
              style={{ width: `${stats.totalDevices > 0 ? (stats.offlineDevices / stats.totalDevices) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Templates */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Templates</span>
            <FileCode2 size={16} className="text-neutral-400" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-semibold text-neutral-900 dark:text-white">{stats.totalTemplates}</span>
            <Link 
              to="/app/templates" 
              className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              Manage
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Data Points Today */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Data Today</span>
            <BarChart3 size={16} className="text-neutral-400" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-semibold text-neutral-900 dark:text-white">
              {stats.todayTelemetry >= 1000 
                ? `${(stats.todayTelemetry / 1000).toFixed(1)}k` 
                : stats.todayTelemetry}
            </span>
            {stats.telemetryChangePercent !== 0 && (
              <span className={`flex items-center gap-0.5 text-xs font-medium ${
                stats.telemetryChangePercent >= 0 
                  ? 'text-emerald-600 dark:text-emerald-500' 
                  : 'text-red-600 dark:text-red-500'
              }`}>
                {stats.telemetryChangePercent >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(stats.telemetryChangePercent)}% vs yesterday
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Devices Overview - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <h2 className="font-medium text-neutral-900 dark:text-white">Devices</h2>
              {stats.offlineDevices > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 rounded">
                  <AlertTriangle size={10} />
                  {stats.offlineDevices} offline
                </span>
              )}
            </div>
            <Link 
              to="/app/devices" 
              className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1"
            >
              View all
              <ArrowRight size={12} />
            </Link>
          </div>
          
          {devicesByStatus.length > 0 ? (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {devicesByStatus.map((device) => (
                <Link 
                  key={device.deviceId} 
                  to={`/app/devices/${device.deviceId}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      device.isOffline 
                        ? 'bg-neutral-100 dark:bg-neutral-800' 
                        : 'bg-emerald-50 dark:bg-emerald-500/10'
                    }`}>
                      {device.isOffline 
                        ? <WifiOff size={14} className="text-neutral-400" />
                        : <Wifi size={14} className="text-emerald-500" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                        {device.name}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {device.type || 'Generic Device'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className={`text-xs font-medium ${device.isOffline ? 'text-neutral-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                        {device.isOffline ? 'Offline' : 'Online'}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {formatRelativeTime(device.lastSeen)}
                      </p>
                    </div>
                    <ArrowUpRight size={14} className="text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-5 py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                <Cpu className="w-6 h-6 text-neutral-400" />
              </div>
              <p className="text-sm font-medium text-neutral-900 dark:text-white">No devices yet</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 mb-4">
                Get started by registering your first IoT device
              </p>
              <Link 
                to="/app/devices/register" 
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <Plus size={14} />
                Register Device
              </Link>
            </div>
          )}
        </div>

        {/* Alerts Panel */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <h2 className="font-medium text-neutral-900 dark:text-white">Alerts</h2>
              {alerts.length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
                  {alerts.length}
                </span>
              )}
            </div>
            <Link 
              to="/app/alerts" 
              className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              View all
            </Link>
          </div>
          
          {alerts.length > 0 ? (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {alerts.map((alert) => (
                <div key={alert.alertId} className="px-5 py-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded ${getAlertSeverityColor(alert.severity)}`}>
                      <AlertTriangle size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-900 dark:text-white line-clamp-2">
                        {alert.message || alert.title}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {formatRelativeTime(alert.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">All clear</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">No unread alerts</p>
            </div>
          )}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="font-medium text-neutral-900 dark:text-white">Recent Activity</h2>
          <Link 
            to="/app/analytics" 
            className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1"
          >
            Analytics
            <ExternalLink size={12} />
          </Link>
        </div>
        
        {recentActivity.length > 0 ? (
          <div className={`grid divide-y md:divide-y-0 ${recentActivity.length > 5 ? 'md:grid-cols-2 md:divide-x' : 'grid-cols-1'} divide-neutral-100 dark:divide-neutral-800`}>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {recentActivity.slice(0, recentActivity.length > 5 ? 5 : recentActivity.length).map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                      {activity.message || activity.type.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <span className="text-xs text-neutral-400 flex-shrink-0">
                    {formatRelativeTime(activity.timestamp)}
                  </span>
                </div>
              ))}
            </div>
            {recentActivity.length > 5 && (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {recentActivity.slice(5, 10).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                        {activity.message || activity.type.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <span className="text-xs text-neutral-400 flex-shrink-0">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3">
              <Activity className="w-5 h-5 text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">No recent activity</p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              Activity will appear when devices send data
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link 
          to="/app/devices/register"
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-colors">
              <Plus size={18} className="text-neutral-600 dark:text-neutral-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-white">Add Device</p>
              <p className="text-xs text-neutral-500">Register new</p>
            </div>
          </div>
        </Link>

        <Link 
          to="/app/templates/new"
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-colors">
              <FileCode2 size={18} className="text-neutral-600 dark:text-neutral-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-white">New Template</p>
              <p className="text-xs text-neutral-500">Create schema</p>
            </div>
          </div>
        </Link>

        <Link 
          to="/app/analytics"
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-colors">
              <BarChart3 size={18} className="text-neutral-600 dark:text-neutral-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-white">Analytics</p>
              <p className="text-xs text-neutral-500">View insights</p>
            </div>
          </div>
        </Link>

        <Link 
          to="/app/alerts"
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-colors">
              <Bell size={18} className="text-neutral-600 dark:text-neutral-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-white">Alerts</p>
              <p className="text-xs text-neutral-500">Manage rules</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
