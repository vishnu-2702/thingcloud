import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Trash2, Save, Layers, Zap, 
  ChevronRight, GripVertical, Hash, Type, ToggleLeft
} from 'lucide-react';
import { templateAPI } from '../services/templateAPI';
import toast from 'react-hot-toast';

const TemplateNew = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    datastreams: []
  });

  const categories = [
    { value: 'general', label: 'General', icon: Layers },
    { value: 'sensor', label: 'Sensor', icon: Zap },
    { value: 'automation', label: 'Automation', icon: ToggleLeft },
    { value: 'monitoring', label: 'Monitoring', icon: Hash },
    { value: 'control', label: 'Control', icon: Type },
    { value: 'security', label: 'Security', icon: Layers },
    { value: 'environmental', label: 'Environmental', icon: Zap }
  ];

  const dataTypes = [
    { value: 'number', label: 'Number', icon: Hash, color: 'emerald' },
    { value: 'string', label: 'String', icon: Type, color: 'blue' },
    { value: 'boolean', label: 'Boolean', icon: ToggleLeft, color: 'purple' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addDatastream = () => {
    setFormData(prev => ({
      ...prev,
      datastreams: [
        ...prev.datastreams,
        {
          id: Date.now().toString(),
          virtualPin: `V${prev.datastreams.length}`,
          name: '',
          dataType: 'number',
          unit: ''
        }
      ]
    }));
  };

  const removeDatastream = (id) => {
    setFormData(prev => ({
      ...prev,
      datastreams: prev.datastreams.filter(ds => ds.id !== id)
    }));
  };

  const updateDatastream = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      datastreams: prev.datastreams.map(ds =>
        ds.id === id ? { ...ds, [field]: value } : ds
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    if (formData.datastreams.some(ds => !ds.name.trim())) {
      toast.error('All datastreams must have a name');
      return;
    }

    setLoading(true);

    try {
      const templateData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        datastreams: formData.datastreams.map(ds => ({
          virtualPin: ds.virtualPin,
          name: ds.name,
          dataType: ds.dataType,
          unit: ds.unit
        }))
      };

      const data = await templateAPI.createTemplate(templateData);
      toast.success('Template created successfully!');
      navigate(`/app/templates/${data.template.id}`);
    } catch (error) {
      console.error('Template creation error:', error);
      toast.error('Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const getDataTypeConfig = (type) => {
    return dataTypes.find(dt => dt.value === type) || dataTypes[0];
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          to="/app/templates" 
          className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft size={20} className="text-neutral-600 dark:text-neutral-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Create New Template</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Define a reusable template for your devices</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <Layers size={16} className="text-neutral-600 dark:text-neutral-400" />
              </div>
              <div>
                <h2 className="font-medium text-neutral-900 dark:text-white">Template Information</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Basic details about your template</p>
              </div>
            </div>
          </div>
          
          <div className="p-5 space-y-5">
            {/* Name & Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-colors"
                  placeholder="e.g., Environmental Sensor"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-colors"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={2}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-colors resize-none"
                placeholder="Describe what this template is for..."
              />
            </div>
          </div>
        </div>

        {/* Datastreams Configuration */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <Zap size={16} className="text-neutral-600 dark:text-neutral-400" />
                </div>
                <div>
                  <h2 className="font-medium text-neutral-900 dark:text-white">Datastreams</h2>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Define what data this template collects</p>
                </div>
              </div>
              <button
                type="button"
                onClick={addDatastream}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
              >
                <Plus size={14} />
                Add
              </button>
            </div>
          </div>
          
          <div className="p-5">
            {formData.datastreams.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-neutral-400" />
                </div>
                <p className="text-neutral-900 dark:text-white font-medium mb-1">No datastreams yet</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                  Add datastreams to define what data this template will collect
                </p>
                <button
                  type="button"
                  onClick={addDatastream}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm font-medium rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  <Plus size={16} />
                  Add First Datastream
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Header Row */}
                <div className="hidden md:flex md:items-center md:gap-4 px-4 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  <div className="w-24 flex-shrink-0">Virtual Pin</div>
                  <div className="flex-1">Name</div>
                  <div className="w-[220px] flex-shrink-0 text-center">Data Type</div>
                  <div className="w-20 flex-shrink-0">Unit</div>
                  <div className="w-10 flex-shrink-0"></div>
                </div>

                {/* Datastream Rows */}
                {formData.datastreams.map((datastream, index) => {
                  const typeConfig = getDataTypeConfig(datastream.dataType);
                  return (
                    <div 
                      key={datastream.id} 
                      className="group bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
                    >
                      {/* Mobile Layout */}
                      <div className="grid grid-cols-2 gap-3 md:hidden">
                        <div>
                          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">Virtual Pin</label>
                          <input
                            type="text"
                            value={datastream.virtualPin}
                            onChange={(e) => updateDatastream(datastream.id, 'virtualPin', e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-colors"
                            placeholder="V0"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">Unit</label>
                          <input
                            type="text"
                            value={datastream.unit}
                            onChange={(e) => updateDatastream(datastream.id, 'unit', e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-colors"
                            placeholder="°C"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">Name</label>
                          <input
                            type="text"
                            value={datastream.name}
                            onChange={(e) => updateDatastream(datastream.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-colors"
                            placeholder="e.g., Temperature"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">Data Type</label>
                          <div className="flex gap-2">
                            {dataTypes.map(type => (
                              <button
                                key={type.value}
                                type="button"
                                onClick={() => updateDatastream(datastream.id, 'dataType', type.value)}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                                  datastream.dataType === type.value
                                    ? type.color === 'emerald'
                                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                      : type.color === 'blue'
                                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                                    : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                                }`}
                              >
                                <type.icon size={14} />
                                {type.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="col-span-2 flex justify-end pt-2 border-t border-neutral-200 dark:border-neutral-700">
                          <button
                            type="button"
                            onClick={() => removeDatastream(datastream.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden md:flex md:items-center md:gap-4">
                        {/* Virtual Pin */}
                        <div className="w-24 flex-shrink-0">
                          <input
                            type="text"
                            value={datastream.virtualPin}
                            onChange={(e) => updateDatastream(datastream.id, 'virtualPin', e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-colors"
                            placeholder="V0"
                          />
                        </div>

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={datastream.name}
                            onChange={(e) => updateDatastream(datastream.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-colors"
                            placeholder="e.g., Temperature"
                            required
                          />
                        </div>

                        {/* Data Type */}
                        <div className="flex-shrink-0">
                          <div className="inline-flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                            {dataTypes.map(type => (
                              <button
                                key={type.value}
                                type="button"
                                onClick={() => updateDatastream(datastream.id, 'dataType', type.value)}
                                title={type.label}
                                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                  datastream.dataType === type.value
                                    ? type.color === 'emerald'
                                      ? 'bg-emerald-500 text-white shadow-sm'
                                      : type.color === 'blue'
                                      ? 'bg-blue-500 text-white shadow-sm'
                                      : 'bg-purple-500 text-white shadow-sm'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                }`}
                              >
                                <type.icon size={12} />
                                <span>{type.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Unit */}
                        <div className="w-20 flex-shrink-0">
                          <input
                            type="text"
                            value={datastream.unit}
                            onChange={(e) => updateDatastream(datastream.id, 'unit', e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-colors"
                            placeholder="°C"
                          />
                        </div>

                        {/* Delete */}
                        <div className="flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => removeDatastream(datastream.id)}
                            className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add Another Button */}
                <button
                  type="button"
                  onClick={addDatastream}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                >
                  <Plus size={16} />
                  Add Another Datastream
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Preview Summary */}
        {(formData.name || formData.datastreams.length > 0) && (
          <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg p-5">
            <h3 className="text-sm font-medium text-neutral-900 dark:text-white mb-3">Template Preview</h3>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {formData.name && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full">
                  <Layers size={14} className="text-neutral-500" />
                  <span className="text-neutral-900 dark:text-white font-medium">{formData.name}</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full text-neutral-600 dark:text-neutral-400">
                {categories.find(c => c.value === formData.category)?.label || 'General'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full text-neutral-600 dark:text-neutral-400">
                <Zap size={14} />
                {formData.datastreams.length} datastream{formData.datastreams.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Link
            to="/app/templates"
            className="px-5 py-2.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !formData.name.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 dark:border-neutral-900/30 border-t-white dark:border-t-neutral-900 rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save size={16} />
                Create Template
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TemplateNew;
