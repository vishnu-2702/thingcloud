import React, { useState, useEffect } from 'react';
import { X, Bell, Plus, Trash2, Power, PowerOff, Edit2, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { alertRuleAPI } from '../services/alertRuleAPI';
import toast from 'react-hot-toast';

const AlertRuleModal = ({ device, template, onClose, onRuleCreated }) => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    datastreamPin: '',
    condition: '',
    threshold: '',
    severity: 'warning',
    message: ''
  });

  useEffect(() => {
    fetchRules();
  }, [device.deviceId]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await alertRuleAPI.getRules(device.deviceId);
      setRules(response.rules || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast.error('Failed to load alert rules');
    } finally {
      setLoading(false);
    }
  };

  const getDatastreamInfo = (pin) => {
    if (template && template.datastreams) {
      const datastream = template.datastreams.find(
        ds => ds.virtualPin === pin || ds.pin === pin
      );
      if (datastream) {
        return {
          name: datastream.name,
          type: datastream.dataType || 'string',
          unit: datastream.unit || ''
        };
      }
    }
    return { name: pin, type: 'string', unit: '' };
  };

  const getAvailableConditions = (dataType) => {
    const conditions = {
      number: [
        { value: 'above', label: 'Above' },
        { value: 'below', label: 'Below' },
        { value: 'equals', label: 'Equals' },
        { value: 'between', label: 'Between' }
      ],
      boolean: [
        { value: 'equals', label: 'Equals' },
        { value: 'notEquals', label: 'Not Equals' }
      ],
      string: [
        { value: 'equals', label: 'Equals' },
        { value: 'notEquals', label: 'Not Equals' },
        { value: 'contains', label: 'Contains' }
      ]
    };
    return conditions[dataType] || conditions.string;
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const datastreamInfo = getDatastreamInfo(formData.datastreamPin);
    
    // Validate and prepare threshold
    let threshold = formData.threshold;
    if (datastreamInfo.type === 'number') {
      if (formData.condition === 'between') {
        // Parse as array [min, max]
        const parts = formData.threshold.split(',').map(p => parseFloat(p.trim()));
        if (parts.length !== 2 || parts.some(isNaN)) {
          toast.error('For "between" condition, enter two numbers separated by comma (e.g., 10, 30)');
          return;
        }
        threshold = parts;
      } else {
        threshold = parseFloat(formData.threshold);
        if (isNaN(threshold)) {
          toast.error('Please enter a valid number');
          return;
        }
      }
    } else if (datastreamInfo.type === 'boolean') {
      threshold = formData.threshold === 'true' || formData.threshold === '1';
    }

    const ruleData = {
      deviceId: device.deviceId,
      deviceName: device.name,
      datastreamPin: formData.datastreamPin,
      datastreamName: datastreamInfo.name,
      dataType: datastreamInfo.type,
      condition: formData.condition,
      threshold: threshold,
      severity: formData.severity,
      message: formData.message || undefined
    };

    try {
      if (editingRule) {
        await alertRuleAPI.updateRule(editingRule.ruleId, {
          condition: ruleData.condition,
          threshold: ruleData.threshold,
          severity: ruleData.severity,
          message: ruleData.message
        });
        toast.success('Alert rule updated successfully');
      } else {
        await alertRuleAPI.createRule(ruleData);
        toast.success('Alert rule created successfully');
      }

      // Reset form and refresh
      setFormData({
        datastreamPin: '',
        condition: '',
        threshold: '',
        severity: 'warning',
        message: ''
      });
      setShowCreateForm(false);
      setEditingRule(null);
      fetchRules();
      
      if (onRuleCreated) {
        onRuleCreated();
      }
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error(error.message || 'Failed to save alert rule');
    }
  };

  const handleToggleRule = async (ruleId) => {
    try {
      await alertRuleAPI.toggleRule(ruleId);
      toast.success('Rule status updated');
      fetchRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('Failed to toggle rule');
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this alert rule?')) {
      return;
    }

    try {
      await alertRuleAPI.deleteRule(ruleId);
      toast.success('Alert rule deleted');
      fetchRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Failed to delete rule');
    }
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setFormData({
      datastreamPin: rule.datastreamPin,
      condition: rule.condition,
      threshold: Array.isArray(rule.threshold) ? rule.threshold.join(', ') : String(rule.threshold),
      severity: rule.severity,
      message: rule.message || ''
    });
    setShowCreateForm(true);
  };

  const cancelForm = () => {
    setShowCreateForm(false);
    setEditingRule(null);
    setFormData({
      datastreamPin: '',
      condition: '',
      threshold: '',
      severity: 'warning',
      message: ''
    });
  };

  const renderThresholdInput = () => {
    if (!formData.datastreamPin) {
      return (
        <input
          type="text"
          value=""
          placeholder="Select a datastream first"
          disabled
          className="w-full px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 text-sm"
        />
      );
    }

    const datastreamInfo = getDatastreamInfo(formData.datastreamPin);

    if (datastreamInfo.type === 'boolean') {
      return (
        <select
          value={formData.threshold}
          onChange={(e) => handleFormChange('threshold', e.target.value)}
          required
          className="w-full px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
        >
          <option value="">Select value...</option>
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      );
    } else if (datastreamInfo.type === 'number') {
      if (formData.condition === 'between') {
        return (
          <input
            type="text"
            value={formData.threshold}
            onChange={(e) => handleFormChange('threshold', e.target.value)}
            placeholder="e.g., 10, 30 (min, max)"
            required
            className="w-full px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
          />
        );
      }
      return (
        <input
          type="number"
          step="any"
          value={formData.threshold}
          onChange={(e) => handleFormChange('threshold', e.target.value)}
          placeholder={`Enter threshold ${datastreamInfo.unit ? `(${datastreamInfo.unit})` : ''}`}
          required
          className="w-full px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
        />
      );
    } else {
      return (
        <input
          type="text"
          value={formData.threshold}
          onChange={(e) => handleFormChange('threshold', e.target.value)}
          placeholder="Enter text value"
          required
          className="w-full px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
        />
      );
    }
  };

  const selectedDatastreamInfo = formData.datastreamPin ? getDatastreamInfo(formData.datastreamPin) : null;

  const SeverityIcon = ({ severity }) => {
    switch (severity) {
      case 'critical': return <AlertCircle size={14} />;
      case 'warning': return <AlertTriangle size={14} />;
      default: return <Info size={14} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-neutral-200 dark:border-neutral-800 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <Bell size={20} className="text-neutral-600 dark:text-neutral-400" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-neutral-900 dark:text-white">Alert Rules</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Configure alerts for {device.name}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Create/Edit Form */}
          {showCreateForm ? (
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-5 mb-6 border border-neutral-200 dark:border-neutral-700">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
                {editingRule ? 'Edit Alert Rule' : 'Create New Alert Rule'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Datastream Selection */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                      Datastream / Sensor
                    </label>
                    <select
                      value={formData.datastreamPin}
                      onChange={(e) => {
                        handleFormChange('datastreamPin', e.target.value);
                        handleFormChange('condition', '');
                        handleFormChange('threshold', '');
                      }}
                      required
                      disabled={editingRule}
                      className="w-full px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-neutral-500 focus:border-transparent disabled:opacity-50"
                    >
                      <option value="">Select datastream...</option>
                      {template && template.datastreams && template.datastreams.map((ds) => (
                        <option key={ds.virtualPin || ds.pin} value={ds.virtualPin || ds.pin}>
                          {ds.name} ({ds.virtualPin || ds.pin}) - {ds.dataType}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Condition */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                      Condition
                    </label>
                    <select
                      value={formData.condition}
                      onChange={(e) => {
                        handleFormChange('condition', e.target.value);
                        handleFormChange('threshold', '');
                      }}
                      required
                      disabled={!formData.datastreamPin}
                      className="w-full px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-neutral-500 focus:border-transparent disabled:opacity-50"
                    >
                      <option value="">Select condition...</option>
                      {selectedDatastreamInfo && getAvailableConditions(selectedDatastreamInfo.type).map((cond) => (
                        <option key={cond.value} value={cond.value}>
                          {cond.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Threshold */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                      Threshold Value
                    </label>
                    {renderThresholdInput()}
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                      Severity
                    </label>
                    <select
                      value={formData.severity}
                      onChange={(e) => handleFormChange('severity', e.target.value)}
                      required
                      className="w-full px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Custom Message */}
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Custom Message (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.message}
                    onChange={(e) => handleFormChange('message', e.target.value)}
                    placeholder="Leave empty for auto-generated message"
                    className="w-full px-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-neutral-500 focus:border-transparent placeholder-neutral-400 dark:placeholder-neutral-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-medium bg-neutral-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
                  >
                    {editingRule ? 'Update Rule' : 'Create Rule'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full mb-6 px-4 py-3 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors flex items-center justify-center gap-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              <Plus size={18} />
              <span className="text-sm font-medium">Create New Alert Rule</span>
            </button>
          )}

          {/* Rules List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-white"></div>
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                <Bell size={28} className="text-neutral-400 dark:text-neutral-500" />
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 font-medium">No alert rules configured</p>
              <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">Create your first rule to get notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.ruleId}
                  className={`rounded-xl p-4 border transition-all ${
                    rule.enabled
                      ? 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                          rule.severity === 'critical'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : rule.severity === 'warning'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        }`}>
                          <SeverityIcon severity={rule.severity} />
                          {rule.severity}
                        </span>
                        <span className="text-xs font-mono bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded-md text-neutral-700 dark:text-neutral-300">
                          {rule.datastreamPin}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                          {rule.datastreamName}
                        </span>
                      </div>
                      
                      <p className="text-sm text-neutral-900 dark:text-white">
                        <span className="font-medium capitalize">{rule.condition}</span>{' '}
                        <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                          {Array.isArray(rule.threshold) ? rule.threshold.join(' – ') : String(rule.threshold)}
                        </span>
                      </p>

                      {rule.message && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 italic truncate">
                          "{rule.message}"
                        </p>
                      )}

                      {rule.triggeredCount > 0 && (
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-2">
                          Triggered {rule.triggeredCount}×
                          {rule.lastTriggered && ` • Last: ${new Date(rule.lastTriggered).toLocaleString()}`}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleRule(rule.ruleId)}
                        className={`p-2 rounded-lg transition-colors ${
                          rule.enabled
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                            : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                        }`}
                        title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                      >
                        {rule.enabled ? <Power size={16} /> : <PowerOff size={16} />}
                      </button>
                      <button
                        onClick={() => handleEditRule(rule)}
                        className="p-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                        title="Edit rule"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.ruleId)}
                        className="p-2 bg-neutral-100 dark:bg-neutral-700 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        title="Delete rule"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {rules.length} rule{rules.length !== 1 ? 's' : ''} ({rules.filter(r => r.enabled).length} enabled)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertRuleModal;
