// ============================================================================
// DEVICE DASHBOARD BUILDER PAGE
// ============================================================================
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Save, RotateCcw, Eye, Edit2, Trash2, Settings, Copy,
  GripVertical, LayoutGrid, RefreshCw, Wifi, WifiOff
} from 'lucide-react';
import GridLayout from 'react-grid-layout';
import toast from 'react-hot-toast';
import { deviceAPI } from '../services/deviceAPI';
import { dashboardLayoutAPI } from '../services/dashboardLayoutAPI';
import { useSocket } from '../contexts/SocketContext';

// Import shared widgets
import {
  LabelWidget, GaugeWidget, RadialGaugeWidget, StatusWidget,
  ProgressWidget, SwitchWidget, SliderWidget, SparklineWidget,
  BarChartWidget, TableWidget, TerminalWidget,
  WIDGET_TYPES, COLOR_PRESETS,
  WidgetPalette, WidgetConfigModal
} from '../components/widgets';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Constants - increased grid for more placement flexibility
const GRID_COLS = 24;
const ROW_HEIGHT = 60;
const GRID_MARGIN = [8, 8];

const DeviceDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const containerRef = useRef(null);
  const userInteracted = useRef(false);
  
  const [device, setDevice] = useState(null);
  const [template, setTemplate] = useState(null);
  const [telemetryData, setTelemetryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [widgets, setWidgets] = useState([]);
  const [layout, setLayout] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Manual refresh handler
  const handleManualRefresh = useCallback(async () => {
    if (!device || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const telemetry = await deviceAPI.getTelemetry(device.deviceId, 50);
      if (telemetry?.telemetry?.length > 0) {
        setTelemetryData(telemetry.telemetry);
        setLastUpdate(new Date());
        toast.success('Data refreshed');
      } else {
        toast.success('No new data');
      }
    } catch (error) {
      console.error('[Dashboard] Manual refresh error:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  }, [device, isRefreshing]);

  // Update lastUpdate when telemetry changes
  useEffect(() => {
    if (telemetryData.length > 0) {
      setLastUpdate(new Date());
    }
  }, [telemetryData]);

  // Measure container width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth - 32; // Subtract padding
        setContainerWidth(Math.max(width, 300));
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => { fetchData(); }, [id]);

  // Socket-based real-time telemetry updates (bonus - instant updates)
  useEffect(() => {
    if (socket && connected && device) {
      console.log('[Dashboard] Setting up socket listeners for device:', device.deviceId);
      socket.emit('join-device-room', device.deviceId);
      
      const handleTelemetry = (data) => {
        console.log('[Dashboard] Received telemetry via socket:', data);
        if (data.deviceId === device.deviceId) {
          setTelemetryData(prev => {
            const newEntry = {
              ...data,
              timestamp: data.timestamp || Date.now()
            };
            const exists = prev.some(p => p.timestamp === newEntry.timestamp);
            if (exists) return prev;
            return [newEntry, ...prev.slice(0, 99)];
          });
        }
      };
      
      socket.on('telemetry', handleTelemetry);
      
      return () => {
        console.log('[Dashboard] Cleaning up socket listeners');
        socket.emit('leave-device-room', device.deviceId);
        socket.off('telemetry', handleTelemetry);
      };
    }
  }, [socket, connected, device]);

  // Always poll every 5 seconds from database (works in both socket and serverless modes)
  useEffect(() => {
    let pollInterval;
    
    if (device) {
      console.log('[Dashboard] Starting 5-second polling for device:', device.deviceId);
      
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
                console.log('[Dashboard] Poll found new data:', newData.length, 'points');
                return [...newData, ...prev].slice(0, 100);
              }
              return prev;
            });
          }
        } catch (error) {
          console.error('[Dashboard] Polling error:', error);
        }
      };
      
      // Poll immediately, then every 5 seconds
      pollTelemetry();
      pollInterval = setInterval(pollTelemetry, 5000);
    }
    
    return () => {
      if (pollInterval) {
        console.log('[Dashboard] Clearing poll interval');
        clearInterval(pollInterval);
      }
    };
  }, [device]);

  const fetchData = async () => {
    try {
      setIsInitialized(false);
      const [deviceData, telemetry, layoutData] = await Promise.all([
        deviceAPI.getDevice(id, true),
        deviceAPI.getTelemetry(id, 100).catch(() => ({ telemetry: [] })),
        dashboardLayoutAPI.getLayout(id).catch(() => null)
      ]);

      setDevice(deviceData.device);
      setTemplate(deviceData.template);
      setTelemetryData(telemetry.telemetry || []);
      
      if (layoutData?.layout?.widgets?.length > 0) {
        console.log('[Dashboard] Loading saved layout:', layoutData.layout.widgets);
        
        const loadedWidgets = [];
        const loadedLayout = [];
        
        layoutData.layout.widgets.forEach((w, idx) => {
          const pos = w.position || {};
          
          // Get widget type config for minW/minH
          const widgetType = WIDGET_TYPES.find(t => t.type === w.type) || { minW: 1, minH: 1 };
          
          // Use saved position values directly - they were validated on save
          // Only use defaults if values are missing
          const x = typeof pos.x === 'number' ? pos.x : (Number(pos.x) || 0);
          const y = typeof pos.y === 'number' ? pos.y : (Number(pos.y) || (idx * 2));
          const width = typeof pos.w === 'number' ? pos.w : (Number(pos.w) || 3);
          const height = typeof pos.h === 'number' ? pos.h : (Number(pos.h) || 2);
          
          // Use widget type's minW/minH to enforce minimum size constraints
          const minW = widgetType.minW || 1;
          const minH = widgetType.minH || 1;
          
          loadedWidgets.push({
            id: w.id,
            type: w.type,
            dataKey: w.dataKey,
            title: w.title,
            config: w.config || {}
          });
          
          // Ensure dimensions respect minW/minH
          loadedLayout.push({
            i: w.id,
            x: x,
            y: y,
            w: Math.max(width, minW),
            h: Math.max(height, minH),
            minW: minW,
            minH: minH
          });
          
          console.log(`[Dashboard] Widget ${w.id}: x=${x}, y=${y}, w=${Math.max(width, minW)}, h=${Math.max(height, minH)}, minW=${minW}, minH=${minH}`);
        });
        
        setWidgets(loadedWidgets);
        setLayout(loadedLayout);
        
        // Delay setting initialized to prevent immediate layout change overwriting
        setTimeout(() => setIsInitialized(true), 100);
      } else {
        // Generate default widgets
        const { widgets: defaultWidgets, layout: defaultLayout } = generateDefaultWidgets(deviceData.template);
        setWidgets(defaultWidgets);
        setLayout(defaultLayout);
        setIsInitialized(true);
        if (defaultWidgets.length > 0) setIsEditMode(true);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load dashboard');
      navigate('/app/devices');
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultWidgets = (tmpl) => {
    if (!tmpl?.datastreams) return { widgets: [], layout: [] };
    
    const defaultWidgets = [];
    const defaultLayout = [];
    
    tmpl.datastreams.slice(0, 6).forEach((ds, i) => {
      const widgetId = `widget-${Date.now()}-${i}`;
      const widgetType = WIDGET_TYPES[0];
      const x = (i % 4) * 3;
      const y = Math.floor(i / 4) * 2;
      
      defaultWidgets.push({
        id: widgetId,
        type: 'label',
        dataKey: ds.virtualPin || ds.pin,
        title: ds.name,
        config: { label: ds.name, unit: ds.unit || '', textColor: COLOR_PRESETS[i % COLOR_PRESETS.length] }
      });
      
      defaultLayout.push({
        i: widgetId,
        x: x,
        y: y,
        w: widgetType.defaultW,
        h: widgetType.defaultH,
        minW: widgetType.minW,
        minH: widgetType.minH
      });
    });
    
    return { widgets: defaultWidgets, layout: defaultLayout };
  };

  const availableDatastreams = useMemo(() => {
    const streams = [];
    if (template?.datastreams) {
      template.datastreams.forEach(ds => {
        streams.push({ key: ds.virtualPin || ds.pin, name: ds.name, dataType: ds.dataType, unit: ds.unit || '' });
      });
    }
    if (telemetryData[0]?.data) {
      Object.keys(telemetryData[0].data).forEach(key => {
        if (!streams.find(s => s.key === key)) {
          streams.push({ key, name: key.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), dataType: typeof telemetryData[0].data[key], unit: '' });
        }
      });
    }
    return streams;
  }, [template, telemetryData]);

  const handleLayoutChange = useCallback((newLayout) => {
    // Only process layout changes if user has actually interacted
    if (!isInitialized || !isEditMode || !userInteracted.current) return;
    
    // Ensure all position values are valid numbers and respect minW/minH constraints
    const validatedLayout = newLayout.map(item => {
      // Get minW/minH from current layout item (set when widget was added)
      const currentItem = layout.find(l => l.i === item.i);
      const minW = currentItem?.minW || item.minW || 1;
      const minH = currentItem?.minH || item.minH || 1;
      
      return {
        ...item,
        x: Math.max(0, Math.round(item.x)),
        y: Math.max(0, Math.round(item.y)),
        w: Math.max(minW, Math.round(item.w)),
        h: Math.max(minH, Math.round(item.h)),
        minW: minW,
        minH: minH
      };
    });
    
    console.log('[Dashboard] Layout changed:', validatedLayout.map(l => ({i: l.i, x: l.x, y: l.y, w: l.w, h: l.h})));
    setLayout(validatedLayout);
    setHasChanges(true);
  }, [isInitialized, isEditMode, layout]);

  const handleDragStart = useCallback(() => {
    userInteracted.current = true;
  }, []);

  const handleResizeStart = useCallback(() => {
    userInteracted.current = true;
  }, []);

  const handleAddWidget = useCallback((widgetType) => {
    const widgetId = `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Find the lowest y position
    const maxY = layout.reduce((max, item) => Math.max(max, item.y + item.h), 0);
    
    const newWidget = {
      id: widgetId,
      type: widgetType.type,
      dataKey: '',
      title: widgetType.name,
      config: { label: widgetType.name }
    };
    
    const newLayoutItem = {
      i: widgetId,
      x: 0,
      y: maxY,
      w: widgetType.defaultW,
      h: widgetType.defaultH,
      minW: widgetType.minW,  // Use widget type's minW
      minH: widgetType.minH   // Use widget type's minH
    };
    
    setWidgets(prev => [...prev, newWidget]);
    setLayout(prev => [...prev, newLayoutItem]);
    setHasChanges(true);
    setShowPalette(false);
    setSelectedWidget(newWidget);
    setShowConfigModal(true);
  }, [layout]);

  const handleDeleteWidget = useCallback((widgetId) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    setLayout(prev => prev.filter(l => l.i !== widgetId));
    setHasChanges(true);
    toast.success('Widget removed');
  }, []);

  const handleDuplicateWidget = useCallback((widget) => {
    const widgetId = `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const widgetType = WIDGET_TYPES.find(t => t.type === widget.type) || WIDGET_TYPES[0];
    const originalLayout = layout.find(l => l.i === widget.id);
    const maxY = layout.reduce((max, item) => Math.max(max, item.y + item.h), 0);
    
    const newWidget = { ...widget, id: widgetId, config: { ...widget.config } };
    const newLayoutItem = {
      i: widgetId,
      x: 0,
      y: maxY,
      w: originalLayout?.w || widgetType.defaultW,
      h: originalLayout?.h || widgetType.defaultH,
      minW: widgetType.minW,
      minH: widgetType.minH
    };
    
    setWidgets(prev => [...prev, newWidget]);
    setLayout(prev => [...prev, newLayoutItem]);
    setHasChanges(true);
    toast.success('Widget duplicated');
  }, [layout]);

  const handleSaveWidgetConfig = useCallback((updates) => {
    if (selectedWidget) {
      setWidgets(prev => prev.map(w => 
        w.id === selectedWidget.id 
          ? { ...w, title: updates.title, dataKey: updates.dataKey, config: updates.config } 
          : w
      ));
      setHasChanges(true);
      setShowConfigModal(false);
      setSelectedWidget(null);
    }
  }, [selectedWidget]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Build widgets with positions from current layout
      const widgetsToSave = widgets.map(w => {
        const layoutItem = layout.find(l => l.i === w.id);
        
        // Get widget type definition to use correct minW/minH
        const widgetType = WIDGET_TYPES.find(t => t.type === w.type);
        const minW = widgetType?.minW || 1;
        const minH = widgetType?.minH || 1;
        
        // Ensure positions are valid integers and respect widget's minimum constraints
        const position = {
          x: Math.max(0, Math.round(layoutItem?.x ?? 0)),
          y: Math.max(0, Math.round(layoutItem?.y ?? 0)),
          w: Math.max(minW, Math.round(layoutItem?.w ?? widgetType?.defaultW ?? 3)),
          h: Math.max(minH, Math.round(layoutItem?.h ?? widgetType?.defaultH ?? 2))
        };
        
        console.log(`[Dashboard] Widget ${w.id} (${w.type}) position:`, position, `minW: ${minW}, minH: ${minH}`);
        
        return { 
          id: w.id,
          type: w.type,
          dataKey: w.dataKey || null,
          title: w.title || '',
          config: w.config || {},
          position
        };
      });
      
      console.log('[Dashboard] Saving widgets:', JSON.stringify(widgetsToSave, null, 2));
      
      await dashboardLayoutAPI.saveLayout(id, { 
        widgets: widgetsToSave, 
        gridCols: GRID_COLS, 
        rowHeight: ROW_HEIGHT 
      });
      
      setHasChanges(false);
      userInteracted.current = false; // Reset interaction flag after save
      toast.success('Dashboard saved!');
    } catch (error) {
      console.error('[Dashboard] Save error:', error);
      toast.error('Failed to save: ' + (error.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset dashboard to default?')) return;
    const { widgets: defaultWidgets, layout: defaultLayout } = generateDefaultWidgets(template);
    setWidgets(defaultWidgets);
    setLayout(defaultLayout);
    setHasChanges(true);
    toast.success('Dashboard reset');
  };

  const latestData = telemetryData[0]?.data || {};

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
      console.error('[Dashboard] Command error:', error);
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4">
        <div className="flex items-center gap-4">
          <Link to={`/app/devices/${id}`} className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
            <ArrowLeft size={18} className="text-neutral-600 dark:text-neutral-400" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              Dashboard Builder
              {isEditMode && <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full uppercase">Edit</span>}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
              {device?.name}
              {hasChanges && <span className="flex items-center gap-1 text-amber-500"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />Unsaved</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Connection Status & Refresh */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className={`flex items-center gap-1.5 text-xs font-medium ${connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span className="hidden sm:inline">{connected ? 'Live' : 'Polling'}</span>
            </div>
            {lastUpdate && (
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 hidden md:inline">
                Updated {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <button 
              onClick={handleManualRefresh} 
              disabled={isRefreshing}
              className="p-1 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
          
          {/* Edit Mode Controls */}
          {isEditMode && (
            <>
              <button onClick={() => setShowPalette(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-neutral-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
                <Plus size={16} />Add Widget
              </button>
              <button onClick={handleReset} className="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors" title="Reset">
                <RotateCcw size={18} />
              </button>
              <button onClick={handleSave} disabled={isSaving || !hasChanges} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-neutral-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50">
                <Save size={16} />{isSaving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
          <button onClick={() => setIsEditMode(!isEditMode)} className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isEditMode ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`}>
            {isEditMode ? <Eye size={16} /> : <Edit2 size={16} />}{isEditMode ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Dashboard Canvas */}
      <div 
        ref={containerRef}
        className={`relative rounded-xl border transition-colors ${isEditMode ? 'bg-neutral-100 dark:bg-neutral-950 border-dashed border-2 border-neutral-300 dark:border-neutral-700' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'}`} 
        style={{ minHeight: '600px' }}
      >
        {isEditMode && (
          <div 
            className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-20" 
            style={{ 
              backgroundImage: `linear-gradient(to right, rgb(150 150 150 / 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgb(150 150 150 / 0.5) 1px, transparent 1px)`, 
              backgroundSize: `${containerWidth / GRID_COLS}px ${ROW_HEIGHT}px` 
            }} 
          />
        )}
        
        {widgets.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center mb-4">
              <LayoutGrid size={36} className="text-neutral-400 dark:text-neutral-500" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No Widgets</h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-center max-w-md px-4">Add widgets to build your dashboard</p>
            <button onClick={() => { setIsEditMode(true); setShowPalette(true); }} className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
              <Plus size={18} />Add First Widget
            </button>
          </div>
        ) : (
          <div className="p-4">
            <GridLayout
              className="layout"
              layout={layout}
              cols={GRID_COLS}
              rowHeight={ROW_HEIGHT}
              width={containerWidth}
              margin={GRID_MARGIN}
              onLayoutChange={handleLayoutChange}
              onDragStart={handleDragStart}
              onResizeStart={handleResizeStart}
              isDraggable={isEditMode}
              isResizable={isEditMode}
              compactType={null}
              preventCollision={false}
              useCSSTransforms={true}
              draggableHandle=".drag-handle"
              resizeHandles={['se', 'sw', 'ne', 'nw', 'e', 'w', 's', 'n']}
            >
              {widgets.map(widget => (
                <div 
                  key={widget.id} 
                  className={`group rounded-xl overflow-hidden transition-all ${
                    isEditMode 
                      ? 'bg-white dark:bg-neutral-800 border-2 border-neutral-900 dark:border-white shadow-lg ring-4 ring-neutral-900/10 dark:ring-white/10' 
                      : 'bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  {isEditMode && (
                    <div className="drag-handle flex items-center justify-between px-2 py-1 bg-neutral-900 dark:bg-white text-white dark:text-black cursor-move">
                      <div className="flex items-center gap-1.5">
                        <GripVertical size={14} />
                        <span className="text-xs font-medium truncate max-w-[100px]">{widget.config?.label || widget.title}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedWidget(widget); setShowConfigModal(true); }} className="p-1 hover:bg-neutral-700 dark:hover:bg-neutral-200 rounded transition-colors" title="Settings"><Settings size={12} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDuplicateWidget(widget); }} className="p-1 hover:bg-neutral-700 dark:hover:bg-neutral-200 rounded transition-colors" title="Duplicate"><Copy size={12} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteWidget(widget.id); }} className="p-1 hover:bg-red-500 dark:hover:bg-red-500 hover:text-white rounded transition-colors" title="Delete"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  )}
                  <div className={`${isEditMode ? 'h-[calc(100%-28px)]' : 'h-full'} overflow-hidden`}>
                    {renderWidget(widget)}
                  </div>
                </div>
              ))}
            </GridLayout>
          </div>
        )}
      </div>

      {showPalette && <WidgetPalette onSelect={handleAddWidget} onClose={() => setShowPalette(false)} />}
      {showConfigModal && selectedWidget && (
        <WidgetConfigModal 
          widget={selectedWidget} 
          datastreams={availableDatastreams} 
          onSave={handleSaveWidgetConfig} 
          onClose={() => { setShowConfigModal(false); setSelectedWidget(null); }} 
        />
      )}
    </div>
  );
};

export default DeviceDashboard;
