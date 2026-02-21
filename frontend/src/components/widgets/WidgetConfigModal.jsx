// ============================================================================
// WIDGET CONFIG MODAL
// ============================================================================
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { WIDGET_TYPES } from './constants';
import ColorPicker from './ColorPicker';
import ConditionEditor from './ConditionEditor';

const WidgetConfigModal = ({ widget, datastreams, onSave, onClose }) => {
  const [config, setConfig] = useState({
    label: widget.config?.label || widget.title || '',
    dataKey: widget.dataKey || '',
    ...widget.config
  });

  const updateConfig = (key, value) => setConfig(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    onSave({
      title: config.label,
      dataKey: config.dataKey,
      config: { ...config }
    });
  };

  const widgetDef = WIDGET_TYPES.find(w => w.type === widget.type);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden border border-neutral-200 dark:border-neutral-800 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            {widgetDef && <widgetDef.icon size={20} className="text-neutral-600 dark:text-neutral-400" />}
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-neutral-900 dark:text-white">Configure {widgetDef?.name}</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{widgetDef?.description}</p>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Label */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Label</label>
            <input
              type="text"
              value={config.label}
              onChange={e => updateConfig('label', e.target.value)}
              className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500"
              placeholder="Widget label"
            />
          </div>

          {/* Data Source (not for table/terminal) */}
          {!['table', 'terminal'].includes(widget.type) && (
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Data Source</label>
              <select
                value={config.dataKey}
                onChange={e => updateConfig('dataKey', e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:ring-2 focus:ring-neutral-500 text-neutral-900 dark:text-white"
              >
                <option value="">Select data source...</option>
                {datastreams.map(ds => (
                  <option key={ds.key} value={ds.key}>{ds.name} ({ds.key})</option>
                ))}
              </select>
            </div>
          )}

          {/* Terminal options */}
          {widget.type === 'terminal' && (
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Default Lines</label>
              <select
                value={config.maxLines ?? 20}
                onChange={e => updateConfig('maxLines', Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white"
              >
                <option value={10}>10 lines</option>
                <option value={20}>20 lines</option>
                <option value={30}>30 lines</option>
                <option value={50}>50 lines</option>
                <option value={100}>100 lines</option>
              </select>
            </div>
          )}

          {/* Table columns */}
          {widget.type === 'table' && (
            <>
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">Columns</label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 bg-neutral-50 dark:bg-neutral-800">
                  {datastreams.map(ds => (
                    <label key={ds.key} className="flex items-center gap-2 p-2 hover:bg-white dark:hover:bg-neutral-700 rounded-lg cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={(config.columns || []).includes(ds.key)}
                        onChange={e => {
                          const cols = config.columns || [];
                          if (e.target.checked) {
                            updateConfig('columns', [...cols, ds.key]);
                          } else {
                            updateConfig('columns', cols.filter(k => k !== ds.key));
                          }
                        }}
                        className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-1 focus:ring-neutral-500 focus:ring-offset-0"
                      />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">{ds.name}</span>
                      <span className="text-xs text-neutral-400 dark:text-neutral-500">({ds.key})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Default Rows</label>
                <select
                  value={config.maxRows ?? 10}
                  onChange={e => updateConfig('maxRows', Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white"
                >
                  <option value={5}>5 rows</option>
                  <option value={10}>10 rows</option>
                  <option value={15}>15 rows</option>
                  <option value={20}>20 rows</option>
                  <option value={25}>25 rows</option>
                  <option value={50}>50 rows</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showTimestamp !== false}
                  onChange={e => updateConfig('showTimestamp', e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-1 focus:ring-neutral-500 focus:ring-offset-0"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">Show Timestamp Column</span>
              </label>
            </>
          )}

          {/* Unit for label/gauge/progress */}
          {['label', 'gauge', 'radialGauge', 'progress'].includes(widget.type) && (
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Unit</label>
              <input
                type="text"
                value={config.unit || ''}
                onChange={e => updateConfig('unit', e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500"
                placeholder="°C, %, kWh, etc."
              />
            </div>
          )}

          {/* Min/Max for gauge/progress/slider */}
          {['gauge', 'radialGauge', 'progress', 'slider'].includes(widget.type) && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Min</label>
                <input
                  type="number"
                  value={config.min ?? 0}
                  onChange={e => updateConfig('min', Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Max</label>
                <input
                  type="number"
                  value={config.max ?? 100}
                  onChange={e => updateConfig('max', Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Decimals for label/gauge/charts */}
          {['label', 'gauge', 'radialGauge', 'sparkline', 'bar'].includes(widget.type) && (
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Decimal Places</label>
              <select
                value={config.decimals ?? 1}
                onChange={e => updateConfig('decimals', Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white"
              >
                <option value={0}>0</option>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </div>
          )}

          {/* Bar chart specific options */}
          {widget.type === 'bar' && (
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Max Bars</label>
              <select
                value={config.maxBars ?? 12}
                onChange={e => updateConfig('maxBars', Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white"
              >
                <option value={6}>6 bars</option>
                <option value={8}>8 bars</option>
                <option value={10}>10 bars</option>
                <option value={12}>12 bars</option>
                <option value={15}>15 bars</option>
                <option value={20}>20 bars</option>
              </select>
            </div>
          )}

          {/* Font size for label */}
          {widget.type === 'label' && (
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Font Size</label>
              <select
                value={config.fontSize || 'text-3xl'}
                onChange={e => updateConfig('fontSize', e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white"
              >
                <option value="text-lg">Small</option>
                <option value="text-xl">Medium</option>
                <option value="text-2xl">Large</option>
                <option value="text-3xl">Extra Large</option>
                <option value="text-4xl">Huge</option>
              </select>
            </div>
          )}

          {/* Color for gauge/progress/charts */}
          {['gauge', 'radialGauge', 'progress', 'sparkline', 'bar', 'slider'].includes(widget.type) && (
            <ColorPicker
              label="Color"
              value={config.color}
              onChange={v => updateConfig('color', v)}
            />
          )}

          {/* Text color for label */}
          {widget.type === 'label' && (
            <ColorPicker
              label="Text Color"
              value={config.textColor || '#ffffff'}
              onChange={v => updateConfig('textColor', v)}
            />
          )}

          {/* Status options */}
          {widget.type === 'status' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">On Label</label>
                  <input
                    type="text"
                    value={config.onLabel || 'ONLINE'}
                    onChange={e => updateConfig('onLabel', e.target.value)}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">Off Label</label>
                  <input
                    type="text"
                    value={config.offLabel || 'OFFLINE'}
                    onChange={e => updateConfig('offLabel', e.target.value)}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ColorPicker label="On Color" value={config.onColor || '#10b981'} onChange={v => updateConfig('onColor', v)} />
                <ColorPicker label="Off Color" value={config.offColor || '#ef4444'} onChange={v => updateConfig('offColor', v)} />
              </div>
            </>
          )}

          {/* Switch options */}
          {widget.type === 'switch' && (
            <div className="grid grid-cols-2 gap-4">
              <ColorPicker label="On Color" value={config.onColor || '#10b981'} onChange={v => updateConfig('onColor', v)} />
              <ColorPicker label="Off Color" value={config.offColor || '#6b7280'} onChange={v => updateConfig('offColor', v)} />
            </div>
          )}

          {/* Sparkline options */}
          {widget.type === 'sparkline' && (
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showArea !== false}
                  onChange={e => updateConfig('showArea', e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-1 focus:ring-neutral-500 focus:ring-offset-0"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">Show Area</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showDots || false}
                  onChange={e => updateConfig('showDots', e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-1 focus:ring-neutral-500 focus:ring-offset-0"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">Show Dots</span>
              </label>
            </div>
          )}

          {/* Conditional Colors */}
          {['label', 'gauge', 'radialGauge', 'progress'].includes(widget.type) && (
            <ConditionEditor
              conditions={config.conditions || []}
              onChange={v => updateConfig('conditions', v)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-medium bg-neutral-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetConfigModal;
