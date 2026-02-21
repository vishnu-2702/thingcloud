import React from 'react';
import { 
  BarChart2, 
  Activity, 
  Gauge, 
  CheckCircle, 
  Table, 
  TrendingUp,
  AreaChart,
  X,
  LayoutGrid
} from 'lucide-react';

const WIDGET_TYPES = [
  {
    type: 'valueCard',
    name: 'Value Card',
    description: 'Display a single value with optional unit',
    icon: Activity,
    minW: 2,
    minH: 2,
    defaultW: 3,
    defaultH: 2
  },
  {
    type: 'lineChart',
    name: 'Line Chart',
    description: 'Show data trends over time',
    icon: TrendingUp,
    minW: 4,
    minH: 3,
    defaultW: 6,
    defaultH: 4
  },
  {
    type: 'gauge',
    name: 'Gauge',
    description: 'Display value as a circular gauge',
    icon: Gauge,
    minW: 2,
    minH: 3,
    defaultW: 3,
    defaultH: 3
  },
  {
    type: 'statusIndicator',
    name: 'Status Indicator',
    description: 'Show on/off or active/inactive status',
    icon: CheckCircle,
    minW: 2,
    minH: 2,
    defaultW: 2,
    defaultH: 2
  },
  {
    type: 'barChart',
    name: 'Bar Chart',
    description: 'Compare values with vertical bars',
    icon: BarChart2,
    minW: 4,
    minH: 3,
    defaultW: 6,
    defaultH: 4
  },
  {
    type: 'areaChart',
    name: 'Area Chart',
    description: 'Show cumulative data with filled area',
    icon: AreaChart,
    minW: 4,
    minH: 3,
    defaultW: 6,
    defaultH: 4
  },
  {
    type: 'table',
    name: 'Data Table',
    description: 'Display data in tabular format',
    icon: Table,
    minW: 4,
    minH: 3,
    defaultW: 6,
    defaultH: 4
  }
];

const WidgetPalette = ({ onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-neutral-200 dark:border-neutral-800 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <LayoutGrid size={20} className="text-neutral-600 dark:text-neutral-400" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-neutral-900 dark:text-white">Add Widget</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Choose a widget type to add to your dashboard</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Widget Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {WIDGET_TYPES.map((widget) => {
              const Icon = widget.icon;
              return (
                <button
                  key={widget.type}
                  onClick={() => onSelect(widget)}
                  className="flex flex-col items-center gap-2 p-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center group-hover:border-neutral-400 transition-colors">
                    <Icon size={24} className="text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm text-neutral-900 dark:text-white">{widget.name}</p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">{widget.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Tip: After adding a widget, click the settings icon to configure its data source.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WidgetPalette;
