// ============================================================================
// DASHBOARD WIDGETS - CONSTANTS & UTILITIES
// ============================================================================
import { 
  Hash, Gauge, PieChart, Activity, Sliders, ToggleLeft, 
  SlidersHorizontal, LineChart, BarChart3, Table, Terminal 
} from 'lucide-react';

// Color presets for widgets
export const COLOR_PRESETS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444',
  '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#a855f7',
  '#22c55e', '#0ea5e9', '#d946ef', '#f43f5e', '#eab308', '#64748b'
];

// Grid configuration - increased grid size for more placement flexibility and better sizing
export const GRID_COLS = { lg: 48, md: 36, sm: 24, xs: 16, xxs: 8 };
export const GRID_BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
export const ROW_HEIGHT = 40;
export const GRID_MARGIN = [8, 8];

// Widget type definitions - with minimum size constraints
export const WIDGET_TYPES = [
  { type: 'label', name: 'Value Display', icon: Hash, description: 'Show a single value', category: 'Display', defaultW: 3, defaultH: 2, minW: 1, minH: 1 },
  { type: 'gauge', name: 'Gauge', icon: Gauge, description: 'Half-circle gauge', category: 'Display', defaultW: 3, defaultH: 2, minW: 2, minH: 2},
  { type: 'radialGauge', name: 'Radial Gauge', icon: PieChart, description: 'Full circle gauge', category: 'Display', defaultW: 3, defaultH: 3, minW: 2, minH: 2 },
  { type: 'status', name: 'Status', icon: Activity, description: 'Status indicator', category: 'Display', defaultW: 3, defaultH: 2, minW: 2, minH: 1 },
  { type: 'progress', name: 'Progress Bar', icon: Sliders, description: 'Progress indicator', category: 'Display', defaultW: 6, defaultH: 2, minW: 3, minH: 1 },
  { type: 'switch', name: 'Switch', icon: ToggleLeft, description: 'Toggle switch', category: 'Control', defaultW: 3, defaultH: 2, minW: 2, minH: 1 },
  { type: 'slider', name: 'Slider', icon: SlidersHorizontal, description: 'Value slider', category: 'Control', defaultW: 6, defaultH: 2, minW: 3, minH: 1 },
  { type: 'sparkline', name: 'Line Chart', icon: LineChart, description: 'Sparkline chart', category: 'Charts', defaultW: 6, defaultH: 3, minW: 4, minH: 2 },
  { type: 'bar', name: 'Bar Chart', icon: BarChart3, description: 'Bar chart', category: 'Charts', defaultW: 5, defaultH: 3, minW: 3, minH: 3 },
  { type: 'table', name: 'Data Table', icon: Table, description: 'Tabular data', category: 'Data', defaultW: 4, defaultH: 3, minW: 3, minH: 2 },
  { type: 'terminal', name: 'Terminal', icon: Terminal, description: 'Data log', category: 'Data', defaultW: 4, defaultH: 3, minW: 3, minH: 2 }
];

// Utility: Apply conditional color based on value
export const applyConditionalColor = (value, conditions, defaultColor) => {
  if (!conditions?.length || typeof value !== 'number') return defaultColor;
  
  for (const cond of conditions) {
    const condValue = parseFloat(cond.value);
    let match = false;
    switch (cond.operator) {
      case '>': match = value > condValue; break;
      case '<': match = value < condValue; break;
      case '>=': match = value >= condValue; break;
      case '<=': match = value <= condValue; break;
      case '==': match = value === condValue; break;
      case '!=': match = value !== condValue; break;
      default: break;
    }
    if (match) return cond.color;
  }
  return defaultColor;
};
