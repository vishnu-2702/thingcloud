import React, { useState, useCallback, useMemo } from 'react';
import GridLayout from 'react-grid-layout';
import { 
  Plus, 
  Save, 
  RotateCcw, 
  Eye, 
  Edit2, 
  Trash2, 
  Settings,
  X,
  Copy,
  Download,
  Maximize2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { dashboardLayoutAPI } from '../../services/dashboardLayoutAPI';
import WidgetPalette from './WidgetPalette';
import WidgetConfigModal from './WidgetConfigModal';
import {
  ValueCardWidget,
  GaugeWidget,
  StatusIndicatorWidget,
  ChartWidget,
  TableWidget
} from './widgets';

// Import CSS for react-grid-layout
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const DashboardBuilder = ({ 
  deviceId, 
  template, 
  initialLayout,
  telemetryData,
  telemetryHistory = [],
  onLayoutSave,
  onClose,
  isEditMode: initialEditMode = true
}) => {
  const [widgets, setWidgets] = useState(initialLayout?.widgets || []);
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [showPalette, setShowPalette] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const gridCols = initialLayout?.gridCols || 12;
  const rowHeight = initialLayout?.rowHeight || 50;

  // Get available datastreams from template
  const availableDatastreams = useMemo(() => {
    if (!template?.datastreams) return [];
    return template.datastreams.map(ds => ({
      key: ds.virtualPin || ds.pin,
      name: ds.name,
      dataType: ds.dataType,
      unit: ds.unit || ''
    }));
  }, [template]);

  // Convert widgets to grid layout format
  const gridLayout = useMemo(() => {
    return widgets.map(widget => ({
      i: widget.id,
      x: widget.position.x,
      y: widget.position.y,
      w: widget.position.w,
      h: widget.position.h,
      minW: widget.minW || 2,
      minH: widget.minH || 2,
      static: !isEditMode
    }));
  }, [widgets, isEditMode]);

  // Handle layout change from grid
  const handleLayoutChange = useCallback((newLayout) => {
    if (!isEditMode) return;

    setWidgets(prevWidgets => {
      const updatedWidgets = prevWidgets.map(widget => {
        const layoutItem = newLayout.find(item => item.i === widget.id);
        if (layoutItem) {
          return {
            ...widget,
            position: {
              x: layoutItem.x,
              y: layoutItem.y,
              w: layoutItem.w,
              h: layoutItem.h
            }
          };
        }
        return widget;
      });
      return updatedWidgets;
    });
    setHasChanges(true);
  }, [isEditMode]);

  // Add new widget
  const handleAddWidget = useCallback((widgetType) => {
    const newWidget = {
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: widgetType.type,
      dataKey: null,
      title: widgetType.name,
      position: {
        x: 0,
        y: Infinity, // Will be placed at bottom
        w: widgetType.defaultW,
        h: widgetType.defaultH
      },
      config: {},
      minW: widgetType.minW,
      minH: widgetType.minH
    };

    setWidgets(prev => [...prev, newWidget]);
    setHasChanges(true);
    setShowPalette(false);
    
    // Open config modal for new widget
    setSelectedWidget(newWidget);
    setShowConfigModal(true);
  }, []);

  // Delete widget
  const handleDeleteWidget = useCallback((widgetId) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    setHasChanges(true);
    toast.success('Widget removed');
  }, []);

  // Update widget configuration
  const handleUpdateWidget = useCallback((widgetId, updates) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, ...updates } : w
    ));
    setHasChanges(true);
  }, []);

  // Duplicate widget
  const handleDuplicateWidget = useCallback((widget) => {
    const newWidget = {
      ...widget,
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      position: {
        ...widget.position,
        x: Math.min(widget.position.x + 1, gridCols - widget.position.w),
        y: widget.position.y + widget.position.h
      }
    };
    setWidgets(prev => [...prev, newWidget]);
    setHasChanges(true);
    toast.success('Widget duplicated');
  }, [gridCols]);

  // Save layout
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dashboardLayoutAPI.saveLayout(deviceId, {
        widgets,
        gridCols,
        rowHeight,
        name: 'Custom Dashboard'
      });
      setHasChanges(false);
      toast.success('Dashboard layout saved');
      if (onLayoutSave) {
        onLayoutSave({ widgets, gridCols, rowHeight });
      }
    } catch (error) {
      console.error('Error saving layout:', error);
      toast.error('Failed to save dashboard layout');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default
  const handleReset = async () => {
    if (!window.confirm('Reset dashboard to default layout? This will remove all customizations.')) {
      return;
    }

    try {
      const response = await dashboardLayoutAPI.generateDefaultLayout(deviceId);
      setWidgets(response.layout?.widgets || []);
      setHasChanges(true);
      toast.success('Dashboard reset to default');
    } catch (error) {
      console.error('Error resetting layout:', error);
      toast.error('Failed to reset dashboard');
    }
  };

  // Open widget config
  const handleConfigWidget = useCallback((widget) => {
    setSelectedWidget(widget);
    setShowConfigModal(true);
  }, []);

  // Save widget config
  const handleSaveWidgetConfig = useCallback((config) => {
    if (selectedWidget) {
      handleUpdateWidget(selectedWidget.id, config);
      setShowConfigModal(false);
      setSelectedWidget(null);
    }
  }, [selectedWidget, handleUpdateWidget]);

  return (
    <div className="h-full flex flex-col bg-neutral-50 dark:bg-neutral-900">
      {/* Toolbar */}
      <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Dashboard Builder
          </h2>
          {hasChanges && (
            <span className="text-sm text-orange-600 dark:text-orange-400 flex items-center">
              <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
              Unsaved changes
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {isEditMode && (
            <>
              <button
                onClick={() => setShowPalette(true)}
                className="px-3 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Add Widget</span>
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors flex items-center space-x-2"
              >
                <RotateCcw size={16} />
                <span>Reset</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
            </>
          )}

          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              isEditMode 
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' 
                : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            {isEditMode ? <Eye size={16} /> : <Edit2 size={16} />}
            <span>{isEditMode ? 'Preview' : 'Edit'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="flex-1 overflow-auto p-4">
        {widgets.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus size={32} className="text-neutral-400" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                No widgets added yet
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                Click "Add Widget" to start building your dashboard
              </p>
              {isEditMode && (
                <button
                  onClick={() => setShowPalette(true)}
                  className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
                >
                  Add Your First Widget
                </button>
              )}
            </div>
          </div>
        ) : (
          <GridLayout
            className="layout"
            layout={gridLayout}
            cols={gridCols}
            rowHeight={rowHeight}
            width={1200}
            onLayoutChange={handleLayoutChange}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            compactType="vertical"
            preventCollision={false}
            margin={[16, 16]}
          >
            {widgets.map(widget => (
              <div 
                key={widget.id}
                className={`bg-white dark:bg-neutral-800 rounded-xl border shadow-sm overflow-hidden ${
                  isEditMode 
                    ? 'border-neutral-400 dark:border-neutral-500 cursor-move' 
                    : 'border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <WidgetRenderer
                  widget={widget}
                  telemetryData={telemetryData}
                  telemetryHistory={telemetryHistory}
                  isEditMode={isEditMode}
                  onConfig={() => handleConfigWidget(widget)}
                  onDelete={() => handleDeleteWidget(widget.id)}
                  onDuplicate={() => handleDuplicateWidget(widget)}
                />
              </div>
            ))}
          </GridLayout>
        )}
      </div>

      {/* Widget Palette Modal */}
      {showPalette && (
        <WidgetPalette
          onSelect={handleAddWidget}
          onClose={() => setShowPalette(false)}
        />
      )}

      {/* Widget Config Modal */}
      {showConfigModal && selectedWidget && (
        <WidgetConfigModal
          widget={selectedWidget}
          availableDatastreams={availableDatastreams}
          onSave={handleSaveWidgetConfig}
          onClose={() => {
            setShowConfigModal(false);
            setSelectedWidget(null);
          }}
        />
      )}
    </div>
  );
};

// Widget Renderer Component
const WidgetRenderer = ({ widget, telemetryData, telemetryHistory, isEditMode, onConfig, onDelete, onDuplicate }) => {
  const currentValue = useMemo(() => {
    if (!telemetryData?.data || !widget.dataKey) return null;
    return telemetryData.data[widget.dataKey];
  }, [telemetryData, widget.dataKey]);

  // Get historical data for charts
  const historyData = useMemo(() => {
    if (!telemetryHistory || !widget.dataKey) return [];
    return telemetryHistory;
  }, [telemetryHistory, widget.dataKey]);

  // Get previous value for trend calculation
  const previousValue = useMemo(() => {
    if (historyData.length < 2) return null;
    const prevItem = historyData[1]; // Second most recent
    if (prevItem?.data) return prevItem.data[widget.dataKey];
    return null;
  }, [historyData, widget.dataKey]);

  return (
    <div className="h-full flex flex-col">
      {/* Widget Header */}
      <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-700 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/50">
        <h3 className="text-sm font-medium text-neutral-900 dark:text-white truncate">
          {widget.title || widget.dataKey || 'Untitled'}
        </h3>
        {isEditMode && (
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => { e.stopPropagation(); onConfig(); }}
              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              title="Configure"
            >
              <Settings size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
              className="p-1 text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400"
              title="Duplicate"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1 text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Widget Content */}
      <div className="flex-1 p-2 overflow-hidden">
        {!widget.dataKey ? (
          <div className="h-full flex items-center justify-center text-center text-neutral-400 dark:text-neutral-500">
            <div>
              <Settings size={24} className="mx-auto mb-2" />
              <p className="text-xs">Click configure to set data source</p>
            </div>
          </div>
        ) : (
          <WidgetContent 
            widget={widget} 
            value={currentValue} 
            previousValue={previousValue}
            historyData={historyData}
          />
        )}
      </div>
    </div>
  );
};

// Widget Content based on type - uses actual widget components
const WidgetContent = ({ widget, value, previousValue, historyData }) => {
  const config = widget.config || {};

  switch (widget.type) {
    case 'valueCard':
      return (
        <ValueCardWidget
          value={value}
          previousValue={previousValue}
          unit={config.unit || ''}
          decimals={config.decimals ?? 2}
          showTrend={config.showTrend !== false}
          color={config.color || '#3B82F6'}
          label={widget.dataKey}
        />
      );

    case 'gauge':
      return (
        <GaugeWidget
          value={value}
          min={config.min ?? 0}
          max={config.max ?? 100}
          unit={config.unit || ''}
          thresholds={config.thresholds}
          showValue={true}
          size="auto"
        />
      );

    case 'statusIndicator':
      return (
        <StatusIndicatorWidget
          value={value}
          onLabel={config.onLabel || 'ON'}
          offLabel={config.offLabel || 'OFF'}
          onColor={config.onColor || '#10B981'}
          offColor={config.offColor || '#EF4444'}
          showPulse={config.showPulse !== false}
        />
      );

    case 'lineChart':
      return (
        <ChartWidget
          data={historyData}
          dataKey={widget.dataKey}
          type="line"
          unit={config.unit || ''}
          color={config.color || '#3B82F6'}
          showGrid={config.showGrid !== false}
          showAxis={config.showAxis !== false}
          animate={config.animate !== false}
        />
      );

    case 'areaChart':
      return (
        <ChartWidget
          data={historyData}
          dataKey={widget.dataKey}
          type="area"
          unit={config.unit || ''}
          color={config.color || '#8B5CF6'}
          showGrid={config.showGrid !== false}
          showAxis={config.showAxis !== false}
          animate={config.animate !== false}
        />
      );

    case 'barChart':
      return (
        <ChartWidget
          data={historyData}
          dataKey={widget.dataKey}
          type="bar"
          unit={config.unit || ''}
          color={config.color || '#10B981'}
          showGrid={config.showGrid !== false}
          showAxis={config.showAxis !== false}
          animate={config.animate !== false}
        />
      );

    case 'table':
      return (
        <TableWidget
          data={historyData}
          columns={config.columns || [{ key: widget.dataKey, label: widget.dataKey }]}
          maxRows={config.maxRows || 10}
          showTimestamp={config.showTimestamp !== false}
          striped={config.striped !== false}
          compact={config.compact || false}
        />
      );

    default:
      return (
        <div className="h-full flex items-center justify-center text-center text-neutral-500">
          <p>Unknown widget type: {widget.type}</p>
        </div>
      );
  }
};

export default DashboardBuilder;
