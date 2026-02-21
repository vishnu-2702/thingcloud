import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Layers, 
  Cpu, 
  Copy,
  Edit,
  Trash2,
  LayoutGrid,
  List,
  RefreshCw,
  X,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { templateAPI } from '../services/templateAPI';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Templates = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // Default to list view

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const data = await templateAPI.getTemplates();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Error loading templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateTemplate = async (templateId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const template = templates.find(t => (t.templateId || t.id) === templateId);
      const name = `Copy of ${template?.name || 'Template'}`;
      
      await templateAPI.cloneTemplate(templateId, name);
      toast.success('Template cloned successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error cloning template:', error);
      toast.error('Error cloning template');
    }
  };

  const handleDeleteTemplate = async (templateId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await templateAPI.deleteTemplate(templateId);
      toast.success('Template deleted successfully');
      setTemplates(templates.filter(t => (t.templateId || t.id) !== templateId));
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Error deleting template');
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(templates.map(t => t.category).filter(Boolean))];

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('all');
  };

  const hasActiveFilters = searchTerm || filterCategory !== 'all';

  const stats = {
    total: templates.length,
    totalDevices: templates.reduce((sum, t) => sum + (t.deviceCount || t.usage || 0), 0),
    totalDatastreams: templates.reduce((sum, t) => sum + (t.datastreams?.length || 0), 0),
    categories: categories.length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-6 h-6 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Templates</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {stats.total} templates · {stats.totalDevices} devices using
          </p>
        </div>
        {isAdmin && (
          <Link to="/app/templates/new">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
              <Plus size={16} />
              New Template
            </button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-semibold text-neutral-900 dark:text-white">{stats.total}</span>
            <Layers size={20} className="text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Templates</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-semibold text-neutral-900 dark:text-white">{stats.totalDevices}</span>
            <Cpu size={20} className="text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Devices Using</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-semibold text-neutral-900 dark:text-white">{stats.totalDatastreams}</span>
            <Zap size={20} className="text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Datastreams</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-semibold text-neutral-900 dark:text-white">{stats.categories}</span>
            <LayoutGrid size={20} className="text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Categories</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-3 p-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-neutral-50 dark:bg-neutral-800 border-0 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters & Actions */}
          <div className="flex items-center gap-2">
            {categories.length > 0 && (
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border-0 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</option>
                ))}
              </select>
            )}

            {/* View Toggle */}
            <div className="flex items-center bg-neutral-50 dark:bg-neutral-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-neutral-700 shadow-sm' : ''}`}
              >
                <List size={16} className="text-neutral-600 dark:text-neutral-400" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-neutral-700 shadow-sm' : ''}`}
              >
                <LayoutGrid size={16} className="text-neutral-600 dark:text-neutral-400" />
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchTemplates}
              className="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-neutral-100 dark:border-neutral-800">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              Showing {filteredTemplates.length} of {templates.length} templates
            </span>
            <button
              onClick={clearFilters}
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Templates List/Grid */}
      {filteredTemplates.length > 0 ? (
        viewMode === 'list' ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              <div className="col-span-5">Template</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2 text-center">Datastreams</div>
              <div className="col-span-2 text-center">Devices</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* Template Rows */}
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredTemplates.map((template) => {
                const templateId = template.templateId || template.id;
                const category = template.category || 'General';
                
                return (
                  <Link
                    key={templateId}
                    to={`/app/templates/${templateId}`}
                    className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group"
                  >
                    {/* Template Info */}
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                        <Layers className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-neutral-900 dark:text-white truncate group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                          {template.name}
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                          {template.description || 'No description'}
                        </p>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="col-span-2 flex items-center">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {category}
                      </span>
                    </div>

                    {/* Datastreams */}
                    <div className="col-span-2 flex items-center justify-center">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {template.datastreams?.length || 0}
                      </span>
                    </div>

                    {/* Devices Using */}
                    <div className="col-span-2 flex items-center justify-center">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {template.usage || template.deviceCount || 0}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-end gap-0.5">
                      {isAdmin && (
                        <>
                          <button 
                            onClick={(e) => handleDuplicateTemplate(templateId, e)}
                            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                            title="Duplicate"
                          >
                            <Copy size={16} />
                          </button>
                          <Link
                            to={`/app/templates/${templateId}/edit`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </Link>
                          <button 
                            onClick={(e) => handleDeleteTemplate(templateId, e)}
                            className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                      <ArrowUpRight size={16} className="text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => {
              const templateId = template.templateId || template.id;
              const category = template.category || 'General';
              
              return (
                <Link
                  key={templateId}
                  to={`/app/templates/${templateId}`}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        <Layers className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-neutral-900 dark:text-white group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                          {template.name}
                        </h3>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">{category}</span>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={(e) => handleDuplicateTemplate(templateId, e)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          title="Duplicate"
                        >
                          <Copy size={14} />
                        </button>
                        <Link
                          to={`/app/templates/${templateId}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </Link>
                        <button
                          onClick={(e) => handleDeleteTemplate(templateId, e)}
                          className="p-1.5 text-neutral-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4 line-clamp-2">
                    {template.description || 'No description available'}
                  </p>

                  <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                        <Zap size={14} />
                        {template.datastreams?.length || 0}
                      </span>
                      <span className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
                        <Cpu size={14} />
                        {template.usage || template.deviceCount || 0}
                      </span>
                    </div>
                    <ArrowUpRight size={16} className="text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              );
            })}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
            <Layers className="w-6 h-6 text-neutral-400" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            {hasActiveFilters ? 'No templates found' : 'No templates yet'}
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mb-6 text-sm">
            {hasActiveFilters 
              ? 'Try adjusting your search or filters.'
              : 'Create your first template to standardize device configurations.'
            }
          </p>
          {!hasActiveFilters ? (
            isAdmin && (
              <Link to="/app/templates/new">
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
                  <Plus size={16} />
                  Create Template
                </button>
              </Link>
            )
          ) : (
            <button
              onClick={clearFilters}
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Templates;
