import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Cpu, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { userAPI } from '../services/userAPI';
import { deviceAPI } from '../services/deviceAPI';

// Check if device is offline based on lastSeen timestamp
const isDeviceOffline = (lastSeen) => {
  if (!lastSeen) return true;
  const OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
  const lastSeenTimestamp = typeof lastSeen === 'string' ? new Date(lastSeen).getTime() : lastSeen;
  return (Date.now() - lastSeenTimestamp) > OFFLINE_THRESHOLD;
};

// Vercel-style Area Chart Component
const AreaChart = ({ data, label, color = 'blue', height = 120 }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  const areaPoints = `0,100 ${points} 100,100`;
  
  const colorClasses = {
    blue: { line: 'stroke-blue-500', fill: 'fill-blue-500/10', dot: 'bg-blue-500' },
    emerald: { line: 'stroke-emerald-500', fill: 'fill-emerald-500/10', dot: 'bg-emerald-500' },
    amber: { line: 'stroke-amber-500', fill: 'fill-amber-500/10', dot: 'bg-amber-500' },
    red: { line: 'stroke-red-500', fill: 'fill-red-500/10', dot: 'bg-red-500' },
  };
  
  const colors = colorClasses[color] || colorClasses.blue;
  
  return (
    <div className="relative" style={{ height }}>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Grid lines */}
        <line x1="0" y1="25" x2="100" y2="25" className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="0.5" />
        <line x1="0" y1="50" x2="100" y2="50" className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="0.5" />
        <line x1="0" y1="75" x2="100" y2="75" className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="0.5" />
        
        {/* Area fill */}
        <polygon points={areaPoints} className={colors.fill} />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          className={colors.line}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      
      {/* Labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-neutral-400 pt-1">
        {data.length > 0 && (
          <>
            <span>{data[0]?.label}</span>
            <span>{data[Math.floor(data.length / 2)]?.label}</span>
            <span>{data[data.length - 1]?.label}</span>
          </>
        )}
      </div>
    </div>
  );
};

// Mini Sparkline Component
const Sparkline = ({ data, color = 'emerald' }) => {
  if (!data || data.length === 0) return null;
  
  const maxValue = Math.max(...data, 1);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (v / maxValue) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  const colorClass = color === 'emerald' ? 'stroke-emerald-500' : color === 'red' ? 'stroke-red-500' : 'stroke-blue-500';
  
  return (
    <svg className="w-16 h-6" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        className={colorClass}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
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
    connectivityStats: {},
    performanceMetrics: {}
  });
  const [allTelemetryData, setAllTelemetryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket, connected } = useSocket();

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  // Real-time updates for analytics
  useEffect(() => {
    if (socket && connected) {
      socket.on('telemetryData', (data) => {
        // Update analytics in real-time when new telemetry comes in
        setAnalyticsData(prev => ({
          ...prev,
          totalDataPoints: prev.totalDataPoints + 1
        }));
      });

      return () => {
        socket.off('telemetryData');
      };
    } else if (!connected) {
      // Fallback: Poll for analytics updates when WebSocket is not available
      const pollInterval = setInterval(() => {
        fetchAnalyticsData();
      }, 60000); // Poll every minute for analytics

      return () => clearInterval(pollInterval);
    }
  }, [socket, connected]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch user stats and devices using the API services
      const [statsData, devicesData] = await Promise.all([
        userAPI.getStats(),
        deviceAPI.getDevices()
      ]);

      let totalDataPoints = 0;
      let totalErrors = 0;
      let connectivityStats = { online: 0, offline: 0, reconnecting: 0 };
      const deviceStats = [];
      let dataRatesSum = 0;
      let responseTimesSum = 0;
      let validDeviceCount = 0;
      const allTelemetry = [];

      const devices = devicesData.devices || [];

      // Calculate connectivity statistics based on lastSeen
      devices.forEach(device => {
        const deviceOffline = isDeviceOffline(device.lastSeen);
        if (!deviceOffline && device.status === 'online') connectivityStats.online++;
        else if (deviceOffline || device.status === 'offline') connectivityStats.offline++;
        else connectivityStats.reconnecting++;
      });

      const uptime = devices.length > 0 ? (connectivityStats.online / devices.length) * 100 : 100;

      // Fetch telemetry data for each device to calculate analytics
      console.log('Analytics: Fetching telemetry for', devices.length, 'devices');
      for (const device of devices) {
        try {
          console.log('Analytics: Fetching telemetry for device:', device.deviceId, device.name);
          const telemetryResponse = await deviceAPI.getDeviceTelemetry(device.deviceId, timeRange);
          console.log('Analytics: Telemetry response for', device.name, ':', telemetryResponse);
          const telemetryData = telemetryResponse.telemetry || [];
          console.log('Analytics: Telemetry data points for', device.name, ':', telemetryData.length);
          const dataPoints = telemetryData.length;
          totalDataPoints += dataPoints;
          
          // Collect all telemetry for chart generation
          allTelemetry.push(...telemetryData);

          // Calculate data transmission rate (points per hour)
          const now = Date.now();
          const hourAgo = now - (60 * 60 * 1000);
          const recentData = telemetryData.filter(point => 
            new Date(point.timestamp).getTime() > hourAgo
          );
          const dataRate = recentData.length;
          dataRatesSum += dataRate;

          // Calculate error rate based on validation
          const invalidData = telemetryData.filter(point => !point.validated);
          const errorRate = dataPoints > 0 ? (invalidData.length / dataPoints) * 100 : 0;
          totalErrors += invalidData.length;

          // Estimate average response time per device using inter-arrival times
          let deviceResponseTime = 0;
          if (telemetryData.length > 1) {
            const sorted = telemetryData.slice().sort((a, b) => a.timestamp - b.timestamp);
            let interArrivalSum = 0;
            for (let i = 1; i < sorted.length; i++) {
              interArrivalSum += (sorted[i].timestamp - sorted[i - 1].timestamp);
            }
            // Use average inter-arrival in ms as a proxy for response time
            deviceResponseTime = interArrivalSum / (sorted.length - 1);
          }

          responseTimesSum += deviceResponseTime;
          validDeviceCount++;

          // Calculate peak usage hours
          const hourlyData = {};
          telemetryData.forEach(point => {
            const hour = new Date(point.timestamp).getHours();
            hourlyData[hour] = (hourlyData[hour] || 0) + 1;
          });
          const peakHour = Object.keys(hourlyData).length > 0 ? Object.keys(hourlyData).reduce((a, b) => 
            hourlyData[a] > hourlyData[b] ? a : b
          ) : '0';

          deviceStats.push({
            name: device.name,
            dataPoints,
            dataRate,
            errorRate: errorRate.toFixed(1),
            uptime: (!isDeviceOffline(device.lastSeen) && device.status === 'online') ? 100 : 0,
            responseTime: Math.round(deviceResponseTime),
            peakHour: `${peakHour}:00`,
            lastUpdate: device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never',
            totalFields: Object.keys(telemetryData[0]?.data || {}).length
          });
        } catch (error) {
          console.warn(`Failed to fetch telemetry for device ${device.name}:`, error);
        }
      }

      // Calculate overall metrics
      const avgDataRate = validDeviceCount > 0 ? dataRatesSum / validDeviceCount : 0; // pts per hour
      const overallErrorRate = totalDataPoints > 0 ? (totalErrors / totalDataPoints) * 100 : 0;
      const avgResponseTime = validDeviceCount > 0 ? responseTimesSum / validDeviceCount : 0; // ms

      setAllTelemetryData(allTelemetry);
      setAnalyticsData({
        totalDataPoints,
        uptime: uptime.toFixed(1),
        dataTransmissionRate: Number(avgDataRate.toFixed(1)),
        errorRate: Number(overallErrorRate.toFixed(1)),
        deviceStats: deviceStats.slice(0, 10),
        connectivityStats,
        performanceMetrics: {
          avgResponseTime: Math.round(avgResponseTime),
          throughput: Number((totalDataPoints / 24).toFixed(1)), // points per hour over 24h
          reliability: Number((100 - overallErrorRate).toFixed(1))
        }
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUptimeColor = (uptime) => {
    if (uptime >= 95) return 'text-emerald-600 dark:text-emerald-400';
    if (uptime >= 85) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Generate chart data from real telemetry
  const chartData = useMemo(() => {
    if (allTelemetryData.length === 0) {
      return [];
    }

    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const dataPoints = [];
    const now = new Date();
    
    // Create time buckets
    const buckets = {};
    for (let i = hours - 1; i >= 0; i--) {
      const date = new Date(now);
      let key, label;
      
      if (timeRange === '24h') {
        date.setHours(date.getHours() - i, 0, 0, 0);
        key = date.getTime();
        label = date.getHours() + ':00';
      } else {
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        key = date.getTime();
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      buckets[key] = { label, value: 0 };
    }
    
    // Aggregate telemetry data into buckets
    allTelemetryData.forEach(point => {
      const timestamp = new Date(point.timestamp);
      let bucketKey;
      
      if (timeRange === '24h') {
        timestamp.setMinutes(0, 0, 0);
        bucketKey = timestamp.getTime();
      } else {
        timestamp.setHours(0, 0, 0, 0);
        bucketKey = timestamp.getTime();
      }
      
      if (buckets[bucketKey] !== undefined) {
        buckets[bucketKey].value++;
      }
    });
    
    // Convert to array
    return Object.values(buckets);
  }, [timeRange, allTelemetryData]);

  const uptimeChartData = useMemo(() => {
    if (allTelemetryData.length === 0) {
      return [];
    }

    const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const dataPoints = [];
    const now = new Date();
    
    // Create time buckets
    const buckets = {};
    for (let i = hours - 1; i >= 0; i--) {
      const date = new Date(now);
      let key, label;
      
      if (timeRange === '24h') {
        date.setHours(date.getHours() - i, 0, 0, 0);
        key = date.getTime();
        label = date.getHours() + ':00';
      } else {
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        key = date.getTime();
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      buckets[key] = { label, value: 0, total: 0 };
    }
    
    // Count telemetry points per bucket (presence indicates uptime)
    allTelemetryData.forEach(point => {
      const timestamp = new Date(point.timestamp);
      let bucketKey;
      
      if (timeRange === '24h') {
        timestamp.setMinutes(0, 0, 0);
        bucketKey = timestamp.getTime();
      } else {
        timestamp.setHours(0, 0, 0, 0);
        bucketKey = timestamp.getTime();
      }
      
      if (buckets[bucketKey] !== undefined) {
        buckets[bucketKey].total++;
      }
    });
    
    // Calculate uptime percentage (if data exists in period, assume 100% for that period)
    const maxCount = Math.max(...Object.values(buckets).map(b => b.total), 1);
    return Object.values(buckets).map(bucket => ({
      label: bucket.label,
      value: bucket.total > 0 ? Math.min(100, (bucket.total / maxCount) * 100) : 0
    }));
  }, [timeRange, allTelemetryData]);

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
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
            <Calendar className="w-4 h-4 text-neutral-400" />
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-sm bg-transparent text-neutral-900 dark:text-white focus:outline-none cursor-pointer appearance-none pr-2"
              style={{
                colorScheme: 'dark'
              }}
            >
              <option value="24h" className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white">Last 24 hours</option>
              <option value="7d" className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white">Last 7 days</option>
              <option value="30d" className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white">Last 30 days</option>
              <option value="3m" className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white">Last 3 months</option>
            </select>
          </div>
          <button
            onClick={fetchAnalyticsData}
            className="p-2 text-neutral-400 hover:text-black dark:hover:text-white bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">Data Points</span>
            <Sparkline data={[20, 35, 45, 30, 55, 40, 60]} color="blue" />
          </div>
          <div className="text-2xl font-semibold text-black dark:text-white">
            {analyticsData.totalDataPoints.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-xs text-emerald-600 dark:text-emerald-400">+12.3%</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">Uptime</span>
            <Sparkline data={[95, 98, 97, 99, 98, 99, 100]} color="emerald" />
          </div>
          <div className="text-2xl font-semibold text-black dark:text-white">{analyticsData.uptime}%</div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-neutral-500">{parseFloat(analyticsData.uptime) >= 95 ? 'Excellent' : 'Good'}</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">Data Rate</span>
            <Sparkline data={[10, 25, 20, 30, 25, 35, 40]} color="blue" />
          </div>
          <div className="text-2xl font-semibold text-black dark:text-white">
            {analyticsData.dataTransmissionRate}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-neutral-500">points/hour</span>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">Error Rate</span>
            <Sparkline data={[5, 3, 4, 2, 3, 2, 1]} color="red" />
          </div>
          <div className="text-2xl font-semibold text-black dark:text-white">{analyticsData.errorRate}%</div>
          <div className="flex items-center gap-1 mt-1">
            <TrendingDown className="w-3 h-3 text-emerald-500" />
            <span className="text-xs text-emerald-600 dark:text-emerald-400">-2.1%</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-medium text-black dark:text-white">Data Collection</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Total data points over time</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-black dark:text-white">{analyticsData.totalDataPoints}</div>
              <div className="text-xs text-emerald-600">+12% from last period</div>
            </div>
          </div>
          <AreaChart data={chartData} color="blue" height={140} />
        </div>
        
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-medium text-black dark:text-white">System Uptime</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Network availability percentage</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-black dark:text-white">{analyticsData.uptime}%</div>
              <div className="text-xs text-neutral-500">Current average</div>
            </div>
          </div>
          <AreaChart data={uptimeChartData} color="emerald" height={140} />
        </div>
      </div>

      {/* Performance & Connectivity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
          <h3 className="text-sm font-medium text-black dark:text-white mb-4">Performance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500">Response Time</span>
              <span className="text-sm font-medium text-black dark:text-white">
                {analyticsData.performanceMetrics?.avgResponseTime || 0}ms
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500">Throughput</span>
              <span className="text-sm font-medium text-black dark:text-white">
                {analyticsData.performanceMetrics?.throughput || 0} pts/hr
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500">Reliability</span>
              <span className="text-sm font-medium text-black dark:text-white">
                {analyticsData.performanceMetrics?.reliability || 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
          <h3 className="text-sm font-medium text-black dark:text-white mb-4">Device Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-sm text-neutral-500">Online</span>
              </div>
              <span className="text-sm font-medium text-black dark:text-white">
                {analyticsData.connectivityStats?.online || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-sm text-neutral-500">Offline</span>
              </div>
              <span className="text-sm font-medium text-black dark:text-white">
                {analyticsData.connectivityStats?.offline || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-sm text-neutral-500">Reconnecting</span>
              </div>
              <span className="text-sm font-medium text-black dark:text-white">
                {analyticsData.connectivityStats?.reconnecting || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
          <h3 className="text-sm font-medium text-black dark:text-white mb-4">Health Score</h3>
          <div className="flex items-center justify-center h-24">
            <div className="text-center">
              <div className="text-4xl font-semibold text-black dark:text-white">
                {parseFloat(analyticsData.uptime) >= 95 ? 'A+' : parseFloat(analyticsData.uptime) >= 85 ? 'B' : 'C'}
              </div>
              <p className="text-xs text-neutral-500 mt-1">Overall system health</p>
            </div>
          </div>
        </div>
      </div>

      {/* Device Performance Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="text-sm font-medium text-black dark:text-white">Device Performance</h3>
        </div>
        
        {analyticsData.deviceStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Device</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Data Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Errors</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Response</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Uptime</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Last Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {analyticsData.deviceStats.map((device, index) => (
                  <tr key={index} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-neutral-400" />
                        <span className="text-sm font-medium text-black dark:text-white">{device.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">{device.dataRate} pts/hr</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${parseFloat(device.errorRate) < 5 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {device.errorRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-400">{device.responseTime}ms</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${getUptimeColor(device.uptime)}`}>
                        {device.uptime}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">{device.lastUpdate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Cpu className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-black dark:text-white mb-1">No device data</h3>
            <p className="text-sm text-neutral-500">
              No devices found or no telemetry data available
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
