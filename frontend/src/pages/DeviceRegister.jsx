import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Cpu, MapPin, Plus, Check, Copy, ExternalLink,
  Layers, FileText, ChevronRight, Zap, Shield, CheckCircle2, Search, X
} from 'lucide-react';
import { deviceAPI } from '../services/deviceAPI';
import { templateAPI } from '../services/templateAPI';
import toast from 'react-hot-toast';

const DeviceRegister = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [registeredDevice, setRegisteredDevice] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [templateSearch, setTemplateSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    template: '',
    location: '',
    description: ''
  });

  useEffect(() => {
    fetchTemplates();
    const templateId = searchParams.get('template');
    if (templateId) {
      setFormData(prev => ({ ...prev, template: templateId }));
    }
  }, [searchParams]);

  const fetchTemplates = async () => {
    try {
      const data = await templateAPI.getTemplates();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCopy = async (text, field) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const deviceData = {
        name: formData.name,
        type: 'generic',
        description: formData.description,
        templateId: formData.template || null
      };

      const data = await deviceAPI.registerDevice(deviceData);
      setRegisteredDevice(data.device);
      toast.success('Device registered successfully!');
    } catch (error) {
      console.error('Error registering device:', error);
      toast.error('Error registering device');
    } finally {
      setLoading(false);
    }
  };

  // Success Screen
  if (registeredDevice) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white mb-2">
            Device Registered Successfully
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Save these credentials to configure your device
          </p>
        </div>

        {/* Credentials Cards */}
        <div className="space-y-4 mb-6">
          {/* Device ID */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Device ID</span>
              <button
                onClick={() => handleCopy(registeredDevice.deviceId, 'deviceId')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  copiedField === 'deviceId'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {copiedField === 'deviceId' ? <Check size={12} /> : <Copy size={12} />}
                {copiedField === 'deviceId' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <code className="block text-lg font-mono text-neutral-900 dark:text-white break-all">
              {registeredDevice.deviceId}
            </code>
          </div>

          {/* API Key */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">API Key</span>
              <button
                onClick={() => handleCopy(registeredDevice.apiKey, 'apiKey')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  copiedField === 'apiKey'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {copiedField === 'apiKey' ? <Check size={12} /> : <Copy size={12} />}
                {copiedField === 'apiKey' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <code className="block text-lg font-mono text-neutral-900 dark:text-white break-all">
              {registeredDevice.apiKey}
            </code>
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-6">
          <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Important Security Notice</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Save these credentials now. The API key won't be shown again for security reasons.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate(`/app/devices/${registeredDevice.deviceId}`)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          >
            View Device
            <ExternalLink size={16} />
          </button>
          <button
            onClick={() => {
              setRegisteredDevice(null);
              setFormData({ name: '', template: '', location: '', description: '' });
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <Plus size={16} />
            Register Another
          </button>
        </div>
      </div>
    );
  }

  // Registration Form
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          to="/app/devices" 
          className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft size={20} className="text-neutral-600 dark:text-neutral-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Register New Device</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Add a new IoT device to your platform</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Device Information Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <Cpu size={16} className="text-neutral-600 dark:text-neutral-400" />
              </div>
              <div>
                <h2 className="font-medium text-neutral-900 dark:text-white">Device Information</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Basic details about your device</p>
              </div>
            </div>
          </div>
          
          <div className="p-5 space-y-5">
            {/* Device Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Device Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-colors"
                placeholder="e.g., Living Room Sensor"
              />
            </div>

            {/* Location & Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-colors"
                    placeholder="e.g., Building A, Room 201"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-colors"
                  placeholder="Brief description"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Template Selection Card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <Layers size={16} className="text-neutral-600 dark:text-neutral-400" />
              </div>
              <div>
                <h2 className="font-medium text-neutral-900 dark:text-white">Device Template</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Select a template to define datastreams</p>
              </div>
            </div>
          </div>
          
          <div className="p-5">
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3">
                  <Layers className="w-6 h-6 text-neutral-400" />
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 mb-3">No templates available</p>
                <Link
                  to="/app/templates/new"
                  className="inline-flex items-center gap-2 text-sm font-medium text-neutral-900 dark:text-white hover:underline"
                >
                  Create a template
                  <ChevronRight size={14} />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder="Search templates..."
                    className="w-full pl-10 pr-10 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white focus:border-transparent transition-colors text-sm"
                  />
                  {templateSearch && (
                    <button
                      type="button"
                      onClick={() => setTemplateSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Template List - Compact */}
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {/* No Template Option */}
                  {(!templateSearch || 'no template'.includes(templateSearch.toLowerCase())) && (
                    <label className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                      formData.template === ''
                        ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                    }`}>
                      <input
                        type="radio"
                        name="template"
                        value=""
                        checked={formData.template === ''}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
                        <FileText size={14} className="text-neutral-500 dark:text-neutral-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">No Template</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Device without datastreams</p>
                      </div>
                      {formData.template === '' && (
                        <Check size={16} className="text-neutral-900 dark:text-white flex-shrink-0" />
                      )}
                    </label>
                  )}

                  {/* Filtered Template Options */}
                  {templates
                    .filter(template => {
                      if (!templateSearch) return true;
                      const search = templateSearch.toLowerCase();
                      return (
                        template.name?.toLowerCase().includes(search) ||
                        template.description?.toLowerCase().includes(search) ||
                        template.category?.toLowerCase().includes(search)
                      );
                    })
                    .map((template) => {
                      const tid = template.templateId || template.id;
                      const isSelected = formData.template === tid;
                      return (
                        <label key={tid} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800'
                            : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                        }`}>
                          <input
                            type="radio"
                            name="template"
                            value={tid}
                            checked={isSelected}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
                            <Zap size={14} className="text-neutral-600 dark:text-neutral-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white">{template.name}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                              {template.datastreams?.length || 0} datastreams • {template.category || 'General'}
                            </p>
                          </div>
                          {isSelected && (
                            <Check size={16} className="text-neutral-900 dark:text-white flex-shrink-0" />
                          )}
                        </label>
                      );
                    })}

                  {/* No Results */}
                  {templateSearch && templates.filter(t => 
                    t.name?.toLowerCase().includes(templateSearch.toLowerCase()) ||
                    t.description?.toLowerCase().includes(templateSearch.toLowerCase()) ||
                    t.category?.toLowerCase().includes(templateSearch.toLowerCase())
                  ).length === 0 && !('no template'.includes(templateSearch.toLowerCase())) && (
                    <div className="text-center py-4 text-neutral-500 dark:text-neutral-400">
                      <p className="text-xs">No templates match "{templateSearch}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Link
            to="/app/devices"
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
                Registering...
              </>
            ) : (
              <>
                Register Device
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeviceRegister;
