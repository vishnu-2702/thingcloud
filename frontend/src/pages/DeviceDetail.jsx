// ============================================================================
// DEVICE DETAIL PAGE
// ============================================================================
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Trash2, Copy, RefreshCw, Clock, MapPin, Cpu, Activity,
  Bell, LayoutDashboard, Database, Settings, Key, ChevronRight, AlertTriangle,
  Plus, Zap, Edit3, ExternalLink, Eye, EyeOff, RotateCw, Check, X,
  TrendingUp, TrendingDown, Minus, Hash, Info
} from 'lucide-react';
import GridLayout from 'react-grid-layout';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';
import { deviceAPI } from '../services/deviceAPI';
import { dashboardLayoutAPI } from '../services/dashboardLayoutAPI';
import AlertRuleModal from '../components/AlertRuleModal';
import TelemetryHistory from '../components/TelemetryHistory';

// Import shared widgets
import {
  LabelWidget, GaugeWidget, RadialGaugeWidget, StatusWidget,
  ProgressWidget, SwitchWidget, SliderWidget, SparklineWidget,
  BarChartWidget, TableWidget, TerminalWidget,
  WIDGET_TYPES
} from '../components/widgets';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Constants - increased grid for more placement flexibility
const GRID_COLS = 24;
const ROW_HEIGHT = 60;
const GRID_MARGIN = [8, 8];

const DeviceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const dashboardContainerRef = useRef(null);
  
  const [device, setDevice] = useState(null);
  const [template, setTemplate] = useState(null);
  const [telemetryData, setTelemetryData] = useState([]);
  const [dashboardLayout, setDashboardLayout] = useState(null);
  const [layout, setLayout] = useState([]);
  const [containerWidth, setContainerWidth] = useState(800);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Settings state
  const [editForm, setEditForm] = useState({ name: '', description: '', location: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isRegeneratingKey, setIsRegeneratingKey] = useState(false);
  const [settingsTab, setSettingsTab] = useState('general');

  const isDeviceOffline = (lastSeen) => {
    if (!lastSeen) return true;
    const OFFLINE_THRESHOLD = 5 * 60 * 1000;
    const lastSeenTimestamp = typeof lastSeen === 'string' ? new Date(lastSeen).getTime() : lastSeen;
    return (Date.now() - lastSeenTimestamp) > OFFLINE_THRESHOLD;
  };

  useEffect(() => { fetchAllData(); }, [id]);

  // Resize observer for dashboard container
  useEffect(() => {
    // Only run when dashboardLayout has widgets and we're on the dashboard tab
    if (!dashboardLayout?.widgets?.length || activeTab !== 'dashboard') return;
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const container = dashboardContainerRef.current;
      if (!container) return;
      
      // Match DeviceDashboard.jsx calculation exactly: offsetWidth - 32 (for padding)
      const updateWidth = () => {
        const width = container.offsetWidth - 32;
        if (width > 0) setContainerWidth(Math.max(width, 300));
      };
      
      updateWidth();
      
      const resizeObserver = new ResizeObserver(() => {
        updateWidth();
      });
      
      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    }, 50);
    
    return () => clearTimeout(timer);
  }, [dashboardLayout, activeTab]);

  // Socket-based real-time updates (bonus - instant updates when connected)
  useEffect(() => {
    if (socket && connected && device) {
      socket.emit('join-device-room', device.deviceId);

      const handleTelemetry = (data) => {
        if (data.deviceId === device.deviceId) {
          setTelemetryData(prev => {
            // Avoid duplicates by timestamp
            const exists = prev.some(p => p.timestamp === data.timestamp);
            if (exists) return prev;
            return [data, ...prev.slice(0, 99)];
          });
          setIsOnline(true);
          setDevice(prev => prev ? { ...prev, lastSeen: Date.now(), status: 'online' } : prev);
        }
      };

      const handleStatus = (status) => {
        if (status.deviceId === device.deviceId) {
          const deviceOffline = isDeviceOffline(status.lastSeen);
          setIsOnline(!deviceOffline && status.status === 'online');
          setDevice(prev => prev ? { ...prev, status: status.status, lastSeen: status.lastSeen } : prev);
        }
      };

      socket.on('telemetry', handleTelemetry);
      socket.on('deviceStatusChanged', handleStatus);

      return () => {
        socket.emit('leave-device-room', device.deviceId);
        socket.off('telemetry', handleTelemetry);
        socket.off('deviceStatusChanged', handleStatus);
      };
    }
  }, [socket, connected, device]);

  // Always poll every 5 seconds from database (works in both socket and serverless modes)
  useEffect(() => {
    let pollInterval;
    
    if (device) {
      console.log('[DeviceDetail] Starting 5-second polling for device:', device.deviceId);
      
      const pollTelemetry = async () => {
        try {
          const telemetry = await deviceAPI.getTelemetry(device.deviceId, 20);
          if (telemetry?.telemetry?.length > 0) {
            setTelemetryData(prev => {
              // Get the latest timestamp we have
              const latestTimestamp = prev[0]?.timestamp || 0;
              // Filter for only new data points
              const newData = telemetry.telemetry.filter(t => 
                new Date(t.timestamp).getTime() > new Date(latestTimestamp).getTime()
              );
              if (newData.length > 0) {
                console.log('[DeviceDetail] Poll found new data:', newData.length, 'points');
                // Update online status if we got new data
                setIsOnline(true);
                setDevice(prev => prev ? { ...prev, lastSeen: Date.now(), status: 'online' } : prev);
                return [...newData, ...prev].slice(0, 100);
              }
              return prev;
            });
          }
          
          // Also refresh device status
          const deviceData = await deviceAPI.getDevice(device.deviceId);
          if (deviceData?.device) {
            const offline = isDeviceOffline(deviceData.device.lastSeen);
            setIsOnline(!offline && deviceData.device.status === 'online');
            setDevice(prev => prev ? { 
              ...prev, 
              lastSeen: deviceData.device.lastSeen, 
              status: deviceData.device.status 
            } : prev);
          }
        } catch (error) {
          console.error('[DeviceDetail] Polling error:', error);
        }
      };
      
      // Poll immediately, then every 5 seconds
      pollTelemetry();
      pollInterval = setInterval(pollTelemetry, 5000);
    }
    
    return () => {
      if (pollInterval) {
        console.log('[DeviceDetail] Clearing poll interval');
        clearInterval(pollInterval);
      }
    };
  }, [device?.deviceId]);

  const fetchAllData = async () => {
    try {
      const [deviceData, telemetry, layoutData] = await Promise.all([
        deviceAPI.getDevice(id, true),
        deviceAPI.getTelemetry(id, 100).catch(() => ({ telemetry: [] })),
        dashboardLayoutAPI.getLayout(id).catch(() => null)
      ]);
      
      setDevice(deviceData.device);
      setTemplate(deviceData.template);
      setTelemetryData(telemetry.telemetry || []);
      
      // Initialize edit form
      setEditForm({
        name: deviceData.device?.name || '',
        description: deviceData.device?.description || '',
        location: deviceData.device?.location || ''
      });
      
      const offline = isDeviceOffline(deviceData.device?.lastSeen);
      setIsOnline(!offline && deviceData.device?.status === 'online');

      if (layoutData?.layout) {
        setDashboardLayout(layoutData.layout);
        if (layoutData.layout.widgets?.length > 0) {
          const newLayout = [];
          layoutData.layout.widgets.forEach((w, idx) => {
            const pos = w.position || {};
            
            // Get widget type config for minW/minH
            const widgetType = WIDGET_TYPES.find(t => t.type === w.type) || { minW: 1, minH: 1 };
            
            // Use saved position values directly - they were validated on save
            const parseNum = (val, fallback) => {
              if (typeof val === 'number') return val;
              const n = Number(val);
              return Number.isFinite(n) ? n : fallback;
            };
            
            const x = parseNum(pos.x, (idx * 3) % 24);
            const y = parseNum(pos.y, Math.floor((idx * 3) / 24) * 2);
            const width = parseNum(pos.w, 3);
            const height = parseNum(pos.h, 2);
            
            // Use widget type's minW/minH to enforce minimum size constraints
            const minW = widgetType.minW || 1;
            const minH = widgetType.minH || 1;
            
            // Ensure dimensions respect minW/minH
            newLayout.push({
              i: w.id, 
              x: x, 
              y: y,
              w: Math.max(width, minW),
              h: Math.max(height, minH),
              minW: minW, 
              minH: minH, 
              static: true
            });
          });
          console.log('[DeviceDetail] Loaded layout:', newLayout);
          setLayout(newLayout);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load device');
      navigate('/app/devices');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDevice = async () => {
    if (!window.confirm('Delete this device? This cannot be undone.')) return;
    try {
      await deviceAPI.deleteDevice(id);
      toast.success('Device deleted');
      navigate('/app/devices');
    } catch (error) {
      toast.error('Failed to delete device');
    }
  };

  const handleCopyApiKey = () => {
    if (device?.apiKey) {
      navigator.clipboard.writeText(device.apiKey);
      toast.success('API Key copied');
    }
  };

  const handleCopyDeviceId = () => {
    if (device?.deviceId) {
      navigator.clipboard.writeText(device.deviceId);
      toast.success('Device ID copied');
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await deviceAPI.updateDevice(id, editForm);
      setDevice(prev => ({ ...prev, ...editForm }));
      toast.success('Settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateApiKey = async () => {
    if (!window.confirm('Regenerate API Key? The old key will stop working immediately.')) return;
    setIsRegeneratingKey(true);
    try {
      const response = await deviceAPI.regenerateApiKey(id);
      setDevice(prev => ({ ...prev, apiKey: response.apiKey }));
      toast.success('API Key regenerated');
    } catch (error) {
      toast.error('Failed to regenerate API Key');
    } finally {
      setIsRegeneratingKey(false);
    }
  };

  const latestData = telemetryData[0]?.data || {};
  
  // Get latest readings with trend indicators
  const getLatestReadings = useMemo(() => {
    if (!template?.datastreams || telemetryData.length === 0) return [];
    
    const readings = [];
    template.datastreams.forEach(ds => {
      const key = ds.virtualPin || ds.pin;
      const currentValue = telemetryData[0]?.data?.[key];
      const prevValue = telemetryData[1]?.data?.[key];
      
      let trend = 'stable';
      if (typeof currentValue === 'number' && typeof prevValue === 'number') {
        if (currentValue > prevValue) trend = 'up';
        else if (currentValue < prevValue) trend = 'down';
      }
      
      readings.push({
        key,
        name: ds.name,
        value: currentValue,
        unit: ds.unit || '',
        dataType: ds.dataType,
        trend,
        timestamp: telemetryData[0]?.timestamp
      });
    });
    
    return readings;
  }, [template, telemetryData]);

  // Command handler for interactive widgets (works with socket or REST API)
  const handleCommand = useCallback(async (dataKey, value) => {
    if (!device) {
      toast.error('No device connected');
      return;
    }
    
    try {
      // Try socket first if available (faster)
      if (socket && connected) {
        socket.emit('device-command', { deviceId: device.deviceId, command: { [dataKey]: value } });
        toast.success(`Command sent: ${dataKey} = ${value}`);
      } else {
        // Fallback to REST API for serverless environments
        await deviceAPI.sendCommand(device.deviceId, { [dataKey]: value });
        toast.success(`Command sent: ${dataKey} = ${value}`);
      }
    } catch (error) {
      console.error('[DeviceDetail] Command error:', error);
      toast.error('Failed to send command');
    }
  }, [socket, connected, device]);

  const renderWidget = (widget) => {
    const value = latestData[widget.dataKey];
    const config = widget.config || {};
    switch (widget.type) {
      case 'label':
      case 'value': // Support both 'label' and 'value' types
        return <LabelWidget value={value} config={config} />;
      case 'gauge': return <GaugeWidget value={value} config={config} />;
      case 'radialGauge': return <RadialGaugeWidget value={value} config={config} />;
      case 'status': return <StatusWidget value={value} config={config} />;
      case 'switch': return <SwitchWidget value={value} config={config} onCommand={handleCommand} dataKey={widget.dataKey} />;
      case 'slider': return <SliderWidget value={value} config={config} onCommand={handleCommand} dataKey={widget.dataKey} />;
      case 'progress': return <ProgressWidget value={value} config={config} />;
      case 'sparkline': return <SparklineWidget data={telemetryData} dataKey={widget.dataKey} config={config} />;
      case 'bar': return <BarChartWidget data={telemetryData} dataKey={widget.dataKey} config={config} />;
      case 'table': return <TableWidget data={telemetryData} config={config} />;
      case 'terminal': return <TerminalWidget data={telemetryData} config={config} />;
      default: return <LabelWidget value={value} config={config} />;
    }
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never';
    const date = new Date(lastSeen);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-white rounded-full animate-spin" />
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <AlertTriangle size={48} className="text-neutral-400 mb-4" />
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Device Not Found</h3>
        <Link to="/app/devices" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">Back to Devices</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4">
        <div className="flex items-center gap-4">
          <Link to="/app/devices" className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
            <ArrowLeft size={18} className="text-neutral-600 dark:text-neutral-400" />
          </Link>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isOnline ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
              <Cpu size={24} className={isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                {device.name}
                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full uppercase ${isOnline ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                <Clock size={14} />{formatLastSeen(device.lastSeen)}
                {device.location && <><MapPin size={14} />{device.location}</>}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/app/devices/${id}/dashboard`} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-neutral-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
            <Edit3 size={16} />Edit Dashboard
          </Link>
          <button onClick={() => setShowAlertModal(true)} className="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors" title="Alerts">
            <Bell size={18} />
          </button>
          <button onClick={handleDeleteDevice} className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <div className="flex border-b border-neutral-200 dark:border-neutral-800">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'telemetry', label: 'Telemetry', icon: Database },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-neutral-900 dark:text-white border-b-2 border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              <tab.icon size={16} />{tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div>
              {dashboardLayout?.widgets?.length > 0 && layout.length > 0 ? (
                <div 
                  ref={dashboardContainerRef}
                  className="bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4" 
                  style={{ minHeight: '400px' }}
                >
                  <GridLayout
                    className="layout"
                    layout={layout}
                    cols={GRID_COLS}
                    rowHeight={ROW_HEIGHT}
                    width={containerWidth}
                    margin={GRID_MARGIN}
                    containerPadding={[8, 8]}
                    isDraggable={false}
                    isResizable={false}
                    compactType={null}
                    useCSSTransforms={true}
                    preventCollision={true}
                  >
                    {dashboardLayout.widgets.map(widget => (
                      <div key={widget.id} className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                        {renderWidget(widget)}
                      </div>
                    ))}
                  </GridLayout>
                </div>
              ) : dashboardLayout?.widgets?.length > 0 ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-neutral-500">Loading dashboard...</div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                    <LayoutDashboard size={32} className="text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No Dashboard Yet</h3>
                  <p className="text-neutral-500 dark:text-neutral-400 mb-4 text-center max-w-md">Create a custom dashboard to visualize your device data</p>
                  <Link to={`/app/devices/${id}/dashboard`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
                    <Plus size={18} />Create Dashboard
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Telemetry Tab */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6">
              {/* Latest Readings Cards */}
              {getLatestReadings.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Latest Readings</h3>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {telemetryData[0]?.timestamp && `Updated ${new Date(telemetryData[0].timestamp).toLocaleTimeString()}`}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {getLatestReadings.map(reading => (
                      <div key={reading.key} className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide truncate">
                            {reading.name}
                          </span>
                          {reading.trend === 'up' && <TrendingUp size={14} className="text-emerald-500" />}
                          {reading.trend === 'down' && <TrendingDown size={14} className="text-red-500" />}
                          {reading.trend === 'stable' && <Minus size={14} className="text-neutral-400" />}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                            {reading.value !== undefined && reading.value !== null
                              ? typeof reading.value === 'number'
                                ? reading.value.toFixed(reading.dataType === 'integer' ? 0 : 2)
                                : String(reading.value)
                              : '--'}
                          </span>
                          {reading.unit && (
                            <span className="text-sm text-neutral-500 dark:text-neutral-400">{reading.unit}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Telemetry History Table */}
              <TelemetryHistory deviceId={id} template={template} />
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Settings Sub-tabs */}
              <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-700 pb-4">
                {[
                  { id: 'general', label: 'General', icon: Settings },
                  { id: 'api', label: 'API & Keys', icon: Key },
                  { id: 'info', label: 'Device Info', icon: Info }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSettingsTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      settingsTab === tab.id
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-black'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <tab.icon size={16} />{tab.label}
                  </button>
                ))}
              </div>

              {/* General Settings */}
              {settingsTab === 'general' && (
                <div className="max-w-2xl space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Device Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Description</label>
                    <textarea
                      value={editForm.description}
                      onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent resize-none"
                      placeholder="Add a description for this device..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Location</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={e => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent"
                      placeholder="e.g., Living Room, Office, Warehouse"
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check size={16} />Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* API & Keys Settings */}
              {settingsTab === 'api' && (
                <div className="max-w-2xl space-y-6">
                  {/* Device ID */}
                  <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">Device ID</h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Unique identifier for this device</p>
                      </div>
                      <button
                        onClick={handleCopyDeviceId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg hover:border-neutral-300 dark:hover:border-neutral-500 transition-colors"
                      >
                        <Copy size={12} />Copy
                      </button>
                    </div>
                    <code className="block w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg font-mono text-sm text-neutral-900 dark:text-white break-all">
                      {device.deviceId}
                    </code>
                  </div>

                  {/* API Key */}
                  <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">API Key</h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Used to authenticate device requests</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg hover:border-neutral-300 dark:hover:border-neutral-500 transition-colors"
                        >
                          {showApiKey ? <EyeOff size={12} /> : <Eye size={12} />}
                          {showApiKey ? 'Hide' : 'Show'}
                        </button>
                        <button
                          onClick={handleCopyApiKey}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg hover:border-neutral-300 dark:hover:border-neutral-500 transition-colors"
                        >
                          <Copy size={12} />Copy
                        </button>
                      </div>
                    </div>
                    <code className="block w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg font-mono text-sm text-neutral-900 dark:text-white break-all">
                      {showApiKey ? device.apiKey : '••••••••••••••••••••••••••••••••'}
                    </code>
                    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                      <button
                        onClick={handleRegenerateApiKey}
                        disabled={isRegeneratingKey}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      >
                        {isRegeneratingKey ? (
                          <>
                            <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                            Regenerating...
                          </>
                        ) : (
                          <>
                            <RotateCw size={14} />Regenerate API Key
                          </>
                        )}
                      </button>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                        Warning: Regenerating the API key will invalidate the current key immediately.
                      </p>
                    </div>
                  </div>

                  {/* API Endpoint Info */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">API Endpoint</h4>
                    <code className="block w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-blue-200 dark:border-blue-700 rounded-lg font-mono text-xs text-blue-800 dark:text-blue-200 break-all">
                      https://iot-platform-backend.vercel.app/api/telemetry
                    </code>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-3">
                      Include the API key in the <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">x-api-key</code> header.
                    </p>
                  </div>
                </div>
              )}

              {/* Device Info */}
              {settingsTab === 'info' && (
                <div className="max-w-2xl space-y-4">
                  <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 divide-y divide-neutral-200 dark:divide-neutral-700">
                    {[
                      { label: 'Device ID', value: device.deviceId },
                      { label: 'Template', value: template?.name || 'None' },
                      { label: 'Status', value: isOnline ? 'Online' : 'Offline', status: isOnline },
                      { label: 'Last Seen', value: formatLastSeen(device.lastSeen) },
                      { label: 'Created', value: device.createdAt ? new Date(device.createdAt).toLocaleString() : 'Unknown' },
                      { label: 'Firmware Version', value: device.firmwareVersion || 'Not reported' },
                      { label: 'Hardware ID', value: device.hardwareId || 'Not set' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between px-5 py-4">
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">{item.label}</span>
                        {item.status !== undefined ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                            item.status
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                              : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${item.status ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                            {item.value}
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-neutral-900 dark:text-white truncate max-w-[200px]">{item.value}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-5 border border-red-200 dark:border-red-800">
                    <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">Danger Zone</h4>
                    <p className="text-xs text-red-700 dark:text-red-300 mb-4">
                      Once you delete a device, there is no going back. Please be certain.
                    </p>
                    <button
                      onClick={handleDeleteDevice}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />Delete Device
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Alert Modal */}
      {showAlertModal && device && (
        <AlertRuleModal
          device={device}
          template={template}
          onClose={() => setShowAlertModal(false)}
          onRuleCreated={() => {
            // Optionally refresh data or show notification
            toast.success('Alert rule saved');
          }}
        />
      )}
    </div>
  );
};

export default DeviceDetail;
