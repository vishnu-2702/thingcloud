// Widget Components Index
// Export all widget components for easy importing

export { default as ValueCardWidget } from './ValueCardWidget';
export { default as GaugeWidget } from './GaugeWidget';
export { default as StatusIndicatorWidget } from './StatusIndicatorWidget';
export { default as ChartWidget } from './ChartWidget';
export { default as TableWidget } from './TableWidget';

// Widget type to component mapping
export const widgetComponents = {
  valueCard: 'ValueCardWidget',
  gauge: 'GaugeWidget', 
  statusIndicator: 'StatusIndicatorWidget',
  lineChart: 'ChartWidget',
  areaChart: 'ChartWidget',
  barChart: 'ChartWidget',
  table: 'TableWidget'
};

// Default configurations for each widget type
export const widgetDefaults = {
  valueCard: {
    title: 'Value',
    unit: '',
    decimals: 2,
    showTrend: true,
    color: '#3B82F6'
  },
  gauge: {
    title: 'Gauge',
    min: 0,
    max: 100,
    unit: '%',
    thresholds: [
      { value: 30, color: '#10B981' },
      { value: 70, color: '#F59E0B' },
      { value: 100, color: '#EF4444' }
    ]
  },
  statusIndicator: {
    title: 'Status',
    onLabel: 'ON',
    offLabel: 'OFF',
    onColor: '#10B981',
    offColor: '#EF4444'
  },
  lineChart: {
    title: 'Line Chart',
    color: '#3B82F6',
    showGrid: true,
    showAxis: true,
    animate: true
  },
  areaChart: {
    title: 'Area Chart',
    color: '#8B5CF6',
    showGrid: true,
    showAxis: true,
    animate: true
  },
  barChart: {
    title: 'Bar Chart',
    color: '#10B981',
    showGrid: true,
    showAxis: true,
    animate: true
  },
  table: {
    title: 'Data Table',
    maxRows: 10,
    showTimestamp: true,
    striped: true,
    compact: false,
    columns: []
  }
};

// Minimum dimensions for each widget type
export const widgetMinDimensions = {
  valueCard: { w: 2, h: 2 },
  gauge: { w: 2, h: 2 },
  statusIndicator: { w: 1, h: 1 },
  lineChart: { w: 3, h: 2 },
  areaChart: { w: 3, h: 2 },
  barChart: { w: 3, h: 2 },
  table: { w: 3, h: 3 }
};

// Default dimensions for each widget type
export const widgetDefaultDimensions = {
  valueCard: { w: 2, h: 2 },
  gauge: { w: 2, h: 3 },
  statusIndicator: { w: 2, h: 2 },
  lineChart: { w: 4, h: 3 },
  areaChart: { w: 4, h: 3 },
  barChart: { w: 4, h: 3 },
  table: { w: 4, h: 4 }
};
