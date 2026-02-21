import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar, Cpu, TrendingUp, TrendingDown, RefreshCw, Activity, Circle, Zap, BarChart3, AlertTriangle } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { userAPI } from '../services/userAPI';
import toast from 'react-hot-toast';

// Check if device is offline based on lastSeen timestamp
const isDeviceOffline = (lastSeen) => {
  if (!lastSeen) return true;
  const OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
  const lastSeenTimestamp = typeof lastSeen === 'string' ? new Date(lastSeen).getTime() : lastSeen;
  return (Date.now() - lastSeenTimestamp) > OFFLINE_THRESHOLD;
};

// Mini Sparkline Component with animation
const Sparkline = ({ data, color = 'emerald' }) => {
  if (!data || data.length === 0) return null;
  
  const maxValue = Math.max(...data, 1);
  const minValue = Math.min(...data, 0);
  const range = maxValue - minValue || 1;
  
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - minValue) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(' ');
  
  const colorMap = {
    emerald: { stroke: '#10b981', fill: '#10b981' },
    red: { stroke: '#ef4444', fill: '#ef4444' },
    blue: { stroke: '#3b82f6', fill: '#3b82f6' },
    purple: { stroke: '#8b5cf6', fill: '#8b5cf6' }
  };
  
  const colors = colorMap[color] || colorMap.blue;
  
  return (
    <svg className="w-20 h-8" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sparkGradient-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.fill} stopOpacity="0.3" />
          <stop offset="100%" stopColor={colors.fill} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon 
        points={`0,100 ${points} 100,100`} 
        fill={`url(#sparkGradient-${color})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={colors.stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

// Enhanced Custom Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-neutral-900 dark:bg-white border border-neutral-800 dark:border-neutral-200 text-white dark:text-black text-xs px-4 py-3 rounded-xl shadow-2xl">
        <p className="font-semibold text-sm mb-2 text-neutral-100 dark:text-neutral-900">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-neutral-400 dark:text-neutral-500 capitalize">{entry.name}:</span>
              <span className="font-medium text-neutral-100 dark:text-neutral-900">
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Custom Legend Component
const CustomLegend = ({ payload }) => {
  // Map gradient URLs to solid colors for legend display
  const getDisplayColor = (entry) => {
    if (entry.color && entry.color.includes('url(')) {
      return '#3b82f6'; // Blue for gradient lines
    }
    return entry.color;
  };
  
  return (
    <div className="flex items-center justify-center gap-6 mt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: getDisplayColor(entry) }}
          />
          <span className="text-xs text-neutral-500 capitalize">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [analyticsData, setAnalyticsData] = useState({
    totalDataPoints: 0,
    uptime: 0,
    dataTransmissionRate: 0,
    errorRate: 0,
    deviceStats: [],
    connectivityStats: { online: 0, offline: 0, reconnecting: 0 },
    performanceMetrics: { avgResponseTime: 0, throughput: 0, reliability: 100 },
    hourlyData: [],
    dailyData: [],
    deviceComparison: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { socket, connected } = useSocket();

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  useEffect(() => {
    if (socket && connected) {
      socket.on('telemetryData', () => {
        setAnalyticsData(prev => ({
          ...prev,
          totalDataPoints: prev.totalDataPoints + 1
        }));
      });
      return () => socket.off('telemetryData');
    }
  }, [socket, connected]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const startTime = performance.now();
      const response = await userAPI.getAnalytics(timeRange);
      const endTime = performance.now();
      const apiResponseTime = Math.round(endTime - startTime);
      
      const data = response.analytics;
      
      setAnalyticsData({
        totalDataPoints: data.totalDataPoints || 0,
        uptime: data.uptime || 0,
        dataTransmissionRate: data.dataTransmissionRate || 0,
        errorRate: data.errorRate || 0,
        deviceStats: data.deviceStats || [],
        connectivityStats: data.connectivityStats || { online: 0, offline: 0, reconnecting: 0 },
        performanceMetrics: {
          avgResponseTime: apiResponseTime,
          throughput: data.performanceMetrics?.throughput || 0,
          reliability: data.performanceMetrics?.reliability || 100
        },
        hourlyData: data.hourlyData || [],
        dailyData: data.dailyData || [],
        deviceComparison: data.deviceComparison || []
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalyticsData();
  };

  const getUptimeColor = (uptime) => {
    if (uptime >= 95) return 'text-emerald-600 dark:text-emerald-400';
    if (uptime >= 85) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

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
          <h1 className="text-2xl font-semibold text-black dark:text-white">Analytics</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Monitor performance and usage metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border-0 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="3m">Last 3 months</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <Sparkline data={analyticsData.hourlyData.slice(-7).map(d => d.dataPoints || 0)} color="blue" />
          </div>
          <div className="text-2xl font-bold text-black dark:text-white">
            {analyticsData.totalDataPoints.toLocaleString()}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Total Data Points</div>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
              <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Active</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <Sparkline data={[95, 98, 97, 99, 98, 99, analyticsData.uptime]} color="emerald" />
          </div>
          <div className="text-2xl font-bold text-black dark:text-white">{analyticsData.uptime}%</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">System Uptime</div>
          <div className="flex items-center gap-1.5 mt-2">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
              parseFloat(analyticsData.uptime) >= 95 
                ? 'bg-emerald-50 dark:bg-emerald-900/20' 
                : parseFloat(analyticsData.uptime) >= 85 
                  ? 'bg-amber-50 dark:bg-amber-900/20' 
                  : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              <span className={`text-xs font-medium ${
                parseFloat(analyticsData.uptime) >= 95 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : parseFloat(analyticsData.uptime) >= 85 
                    ? 'text-amber-600 dark:text-amber-400' 
                    : 'text-red-600 dark:text-red-400'
              }`}>
                {parseFloat(analyticsData.uptime) >= 95 ? 'Excellent' : parseFloat(analyticsData.uptime) >= 85 ? 'Good' : 'Needs attention'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <Sparkline data={analyticsData.hourlyData.slice(-7).map(d => d.dataPoints || 0)} color="purple" />
          </div>
          <div className="text-2xl font-bold text-black dark:text-white">
            {analyticsData.dataTransmissionRate}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Data Rate</div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs text-neutral-400">points/hour</span>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors group">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <Sparkline data={analyticsData.dailyData.slice(-7).map(d => d.errors || 0)} color="red" />
          </div>
          <div className="text-2xl font-bold text-black dark:text-white">{analyticsData.errorRate}%</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Error Rate</div>
          <div className="flex items-center gap-1.5 mt-2">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
              parseFloat(analyticsData.errorRate) < 2 
                ? 'bg-emerald-50 dark:bg-emerald-900/20' 
                : parseFloat(analyticsData.errorRate) < 5 
                  ? 'bg-amber-50 dark:bg-amber-900/20' 
                  : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              <TrendingDown className={`w-3 h-3 ${
                parseFloat(analyticsData.errorRate) < 5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`} />
              <span className={`text-xs font-medium ${
                parseFloat(analyticsData.errorRate) < 2 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : parseFloat(analyticsData.errorRate) < 5 
                    ? 'text-amber-600 dark:text-amber-400' 
                    : 'text-red-600 dark:text-red-400'
              }`}>
                {parseFloat(analyticsData.errorRate) < 2 ? 'Minimal' : parseFloat(analyticsData.errorRate) < 5 ? 'Low' : 'High'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hourly Distribution - Area Chart */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-medium text-black dark:text-white">Hourly Distribution</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Data points collected per hour</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Live</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={analyticsData.hourlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="hourlyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25}/>
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e5e5" 
                className="dark:stroke-neutral-800" 
                vertical={false} 
              />
              <XAxis 
                dataKey="hour" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#737373' }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#737373' }}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '5 5' }} />
              <Area 
                type="monotone" 
                dataKey="dataPoints"
                name="Data Points"
                stroke="#3b82f6" 
                strokeWidth={2.5}
                fill="url(#hourlyGradient)"
                dot={false}
                activeDot={{ r: 6, strokeWidth: 3, stroke: '#fff', fill: '#3b82f6' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Device Comparison - Bar Chart */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-medium text-black dark:text-white">Device Comparison</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Data points by device</p>
            </div>
            <span className="text-xs text-neutral-400">{analyticsData.deviceComparison.length} devices</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analyticsData.deviceComparison} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#059669" stopOpacity={1}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e5e5" 
                className="dark:stroke-neutral-800" 
                vertical={false} 
              />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#737373' }}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#737373' }}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar 
                dataKey="dataPoints" 
                name="Data Points"
                fill="url(#barGradient)" 
                radius={[6, 6, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Trend - Line Chart */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-medium text-black dark:text-white">Weekly Trend</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Data points vs errors over time</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={analyticsData.dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="lineGradientBlue" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#3b82f6" floodOpacity="0.3"/>
                </filter>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e5e5" 
                className="dark:stroke-neutral-800" 
                vertical={false} 
              />
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#737373' }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#737373' }}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e5e5e5', strokeWidth: 1 }} />
              <Legend content={<CustomLegend />} />
              <Line 
                type="monotone" 
                dataKey="dataPoints"
                name="Data Points"
                stroke="url(#lineGradientBlue)"
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6, strokeWidth: 3, stroke: '#fff', fill: '#3b82f6' }}
                filter="url(#shadow)"
              />
              <Line 
                type="monotone" 
                dataKey="errors"
                name="Errors"
                stroke="#ef4444" 
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: '#ef4444' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Connectivity Status */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-black dark:text-white">Device Status</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Current connectivity overview</p>
          </div>
          
          {/* Status Progress Bar */}
          <div className="mb-6">
            <div className="h-3 rounded-full overflow-hidden flex bg-neutral-100 dark:bg-neutral-800">
              {analyticsData.connectivityStats.online > 0 && (
                <div 
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ 
                    width: `${(analyticsData.connectivityStats.online / (analyticsData.connectivityStats.online + analyticsData.connectivityStats.offline + analyticsData.connectivityStats.reconnecting || 1)) * 100}%` 
                  }}
                />
              )}
              {analyticsData.connectivityStats.reconnecting > 0 && (
                <div 
                  className="bg-amber-500 transition-all duration-500"
                  style={{ 
                    width: `${(analyticsData.connectivityStats.reconnecting / (analyticsData.connectivityStats.online + analyticsData.connectivityStats.offline + analyticsData.connectivityStats.reconnecting || 1)) * 100}%` 
                  }}
                />
              )}
              {analyticsData.connectivityStats.offline > 0 && (
                <div 
                  className="bg-red-500 transition-all duration-500"
                  style={{ 
                    width: `${(analyticsData.connectivityStats.offline / (analyticsData.connectivityStats.online + analyticsData.connectivityStats.offline + analyticsData.connectivityStats.reconnecting || 1)) * 100}%` 
                  }}
                />
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
              <div className="flex items-center justify-center mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Online</span>
              </div>
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {analyticsData.connectivityStats.online}
              </div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
              <div className="flex items-center justify-center mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2"></div>
                <span className="text-xs font-medium text-red-600 dark:text-red-400">Offline</span>
              </div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {analyticsData.connectivityStats.offline}
              </div>
            </div>
            <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
              <div className="flex items-center justify-center mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2 animate-pulse"></div>
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Reconnecting</span>
              </div>
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {analyticsData.connectivityStats.reconnecting}
              </div>
            </div>
          </div>
          
          {/* Performance Summary */}
          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-neutral-500 mb-1">Response Time</div>
                <div className="text-lg font-semibold text-black dark:text-white">
                  {analyticsData.performanceMetrics.avgResponseTime}<span className="text-xs text-neutral-400 ml-0.5">ms</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">Throughput</div>
                <div className="text-lg font-semibold text-black dark:text-white">
                  {analyticsData.performanceMetrics.throughput}<span className="text-xs text-neutral-400 ml-0.5">/hr</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500 mb-1">Reliability</div>
                <div className="text-lg font-semibold text-black dark:text-white">
                  {analyticsData.performanceMetrics.reliability}<span className="text-xs text-neutral-400 ml-0.5">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Device Performance Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="text-sm font-medium text-black dark:text-white">Device Performance</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            {analyticsData.deviceStats.length > 0 
              ? `Showing ${analyticsData.deviceStats.length} device${analyticsData.deviceStats.length !== 1 ? 's' : ''}`
              : 'No devices found'}
          </p>
        </div>
        
        {analyticsData.deviceStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Device</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">Data Points</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">Rate/hr</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">Errors</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Last Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {analyticsData.deviceStats.map((device, index) => {
                  const offline = isDeviceOffline(device.lastSeen) || device.status === 'offline';
                  const online = !offline && device.status === 'online';
                  
                  return (
                    <tr key={index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${online ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                            <Cpu className={`w-4 h-4 ${online ? 'text-emerald-600' : 'text-red-600'}`} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-black dark:text-white">{device.name}</div>
                            <div className="text-xs text-neutral-400">{device.deviceId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          online
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                          {offline ? 'Offline' : 'Online'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-black dark:text-white">
                          {device.dataPoints.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">{device.dataRate}/hr</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm font-medium ${
                          device.errorRate < 5 ? 'text-emerald-600' : device.errorRate < 10 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {device.errorRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-500">{device.lastUpdate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Cpu className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-black dark:text-white mb-1">No device data</h3>
            <p className="text-sm text-neutral-500">
              Devices will appear here once they start sending telemetry
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
