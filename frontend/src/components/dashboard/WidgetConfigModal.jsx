import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Settings } from 'lucide-react';

const WidgetConfigModal = ({ widget, availableDatastreams, onSave, onClose }) => {
  const [config, setConfig] = useState({
    title: widget.title || '',
    dataKey: widget.dataKey || '',
    config: {
      unit: widget.config?.unit || '',
      min: widget.config?.min ?? 0,
      max: widget.config?.max ?? 100,
      decimals: widget.config?.decimals ?? 1,
      color: widget.config?.color || '#3B82F6',
      showLabel: widget.config?.showLabel ?? true,
      refreshInterval: widget.config?.refreshInterval || 5000
    }
  });

  const [errors, setErrors] = useState({});

  // Get selected datastream info
  const selectedDatastream = availableDatastreams.find(
    ds => ds.key === config.dataKey
  );

  // Update unit when datastream changes
  useEffect(() => {
    if (selectedDatastream && !config.config.unit) {
      setConfig(prev => ({
        ...prev,
        config: {
          ...prev.config,
          unit: selectedDatastream.unit || ''
        }
      }));
    }
  }, [selectedDatastream]);

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setConfig(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setConfig(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!config.dataKey) {
      newErrors.dataKey = 'Please select a data source';
    }
    
    if (!config.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (widget.type === 'gauge') {
      if (config.config.min >= config.config.max) {
        newErrors['config.min'] = 'Min must be less than max';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    onSave({
      title: config.title,
      dataKey: config.dataKey,
      config: config.config
    });
  };

  const renderTypeSpecificConfig = () => {
    switch (widget.type) {
      case 'gauge':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Min Value
                </label>
                <input
                  type="number"
                  value={config.config.min}
                  onChange={(e) => handleChange('config.min', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2.5 border rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-neutral-500 focus:border-transparent ${
                    errors['config.min'] 
                      ? 'border-red-500' 
                      : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                />
                {errors['config.min'] && (
                  <p className="mt-1 text-xs text-red-500">{errors['config.min']}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Max Value
                </label>
                <input
                  type="number"
                  value={config.config.max}
                  onChange={(e) => handleChange('config.max', parseFloat(e.target.value) || 100)}
                  className="w-full px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
                />
              </div>
            </div>
          </>
        );

      case 'valueCard':
        return (
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              Decimal Places
            </label>
            <select
              value={config.config.decimals}
              onChange={(e) => handleChange('config.decimals', parseInt(e.target.value))}
              className="w-full px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
            >
              <option value={0}>0 (Integer)</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>
        );

      case 'lineChart':
      case 'areaChart':
      case 'barChart':
        return (
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              Chart Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.config.color}
                onChange={(e) => handleChange('config.color', e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-neutral-200 dark:border-neutral-700"
              />
              <input
                type="text"
                value={config.config.color}
                onChange={(e) => handleChange('config.color', e.target.value)}
                className="flex-1 px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      case 'statusIndicator':
        return (
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.config.showLabel}
                onChange={(e) => handleChange('config.showLabel', e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-1 focus:ring-neutral-500 focus:ring-offset-0"
              />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                Show status label
              </span>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-neutral-200 dark:border-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <Settings size={20} className="text-neutral-600 dark:text-neutral-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Configure Widget
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {widget.type.replace(/([A-Z])/g, ' $1').trim()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X size={18} className="text-neutral-500 dark:text-neutral-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[60vh] space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              Widget Title *
            </label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter widget title"
              className={`w-full px-3 py-2.5 border rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-neutral-500 focus:border-transparent ${
                errors.title 
                  ? 'border-red-500' 
                  : 'border-neutral-200 dark:border-neutral-700'
              }`}
            />
            {errors.title && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.title}
              </p>
            )}
          </div>

          {/* Data Source */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              Data Source *
            </label>
            {availableDatastreams.length > 0 ? (
              <select
                value={config.dataKey}
                onChange={(e) => {
                  const ds = availableDatastreams.find(d => d.key === e.target.value);
                  handleChange('dataKey', e.target.value);
                  if (ds && !config.title) {
                    handleChange('title', ds.name);
                  }
                }}
                className={`w-full px-3 py-2.5 border rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-neutral-500 focus:border-transparent ${
                  errors.dataKey 
                    ? 'border-red-500' 
                    : 'border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <option value="">Select a datastream...</option>
                {availableDatastreams.map((ds) => (
                  <option key={ds.key} value={ds.key}>
                    {ds.name} ({ds.key}) - {ds.dataType}
                    {ds.unit && ` [${ds.unit}]`}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-2.5 border border-amber-200 dark:border-amber-700 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  No datastreams available. Configure a template for this device first.
                </p>
              </div>
            )}
            {errors.dataKey && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.dataKey}
              </p>
            )}
          </div>

          {/* Unit */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              Unit (optional)
            </label>
            <input
              type="text"
              value={config.config.unit}
              onChange={(e) => handleChange('config.unit', e.target.value)}
              placeholder="e.g., °C, %, lux"
              className="w-full px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
            />
          </div>

          {/* Type-specific configuration */}
          {renderTypeSpecificConfig()}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Save size={16} />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WidgetConfigModal;
