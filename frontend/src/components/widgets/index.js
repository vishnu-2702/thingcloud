// ============================================================================
// DASHBOARD WIDGETS - INDEX
// ============================================================================
// Central export point for all dashboard widgets
// ============================================================================

export { default as LabelWidget } from './LabelWidget';
export { default as GaugeWidget } from './GaugeWidget';
export { default as RadialGaugeWidget } from './RadialGaugeWidget';
export { default as StatusWidget } from './StatusWidget';
export { default as ProgressWidget } from './ProgressWidget';
export { default as SwitchWidget } from './SwitchWidget';
export { default as SliderWidget } from './SliderWidget';
export { default as SparklineWidget } from './SparklineWidget';
export { default as BarChartWidget } from './BarChartWidget';
export { default as TableWidget } from './TableWidget';
export { default as TerminalWidget } from './TerminalWidget';

// Constants and utilities
export { WIDGET_TYPES, COLOR_PRESETS, applyConditionalColor } from './constants';

// Widget palette modal
export { default as WidgetPalette } from './WidgetPalette';

// Color picker
export { default as ColorPicker } from './ColorPicker';

// Condition editor
export { default as ConditionEditor } from './ConditionEditor';

// Widget config modal
export { default as WidgetConfigModal } from './WidgetConfigModal';
