import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Cpu, 
  Trash2,
  LayoutGrid,
  List,
  RefreshCw,
  X,
  Wifi,
  WifiOff,
  Copy,
  ExternalLink
} from 'lucide-react';
import { deviceAPI } from '../services/deviceAPI';
import toast from 'react-hot-toast';

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('table');
  const [sortBy, setSortBy] = useState('lastSeen');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedDevices, setSelectedDevices] = useState([]);

  const isDeviceOffline = (lastSeen) => {
    if (!lastSeen) return true;
    const OFFLINE_THRESHOLD = 5 * 60 * 1000;
    const lastSeenTimestamp = typeof lastSeen === 'string' ? new Date(lastSeen).getTime() : lastSeen;
    return (Date.now() - lastSeenTimestamp) > OFFLINE_THRESHOLD;
  };

  const deviceTypes = useMemo(() => 
    [...new Set(devices.map(d => d.type || 'Generic'))],
    [devices]
  );

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const data = await deviceAPI.getDevices();
      setDevices(data.devices || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const deleteDevice = async (deviceId, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this device?')) return;

    try {
      await deviceAPI.deleteDevice(deviceId);
      setDevices(devices.filter(device => device.deviceId !== deviceId));
      setSelectedDevices(prev => prev.filter(id => id !== deviceId));
      toast.success('Device deleted');
    } catch (error) {
      console.error('Error deleting device:', error);
      toast.error('Failed to delete device');
    }
  };

  const bulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedDevices.length} devices?`)) return;
    
    try {
      await Promise.all(selectedDevices.map(id => deviceAPI.deleteDevice(id)));
      setDevices(devices.filter(d => !selectedDevices.includes(d.deviceId)));
      setSelectedDevices([]);
      toast.success(`Deleted ${selectedDevices.length} devices`);
    } catch (error) {
      toast.error('Failed to delete some devices');
    }
  };

  const copyDeviceId = (deviceId, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    navigator.clipboard.writeText(deviceId);
    toast.success('Device ID copied');
  };

  // Filtered and sorted devices
  const filteredDevices = useMemo(() => {
    let result = devices.filter(device => {
      const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (device.deviceId && device.deviceId.toLowerCase().includes(searchTerm.toLowerCase()));
      const effectiveStatus = isDeviceOffline(device.lastSeen) ? 'offline' : (device.status || 'offline');
      const matchesStatus = filterStatus === 'all' || effectiveStatus === filterStatus;
      const deviceType = device.type || 'Generic';
      const matchesType = filterType === 'all' || deviceType === filterType;
      
      return matchesSearch && matchesStatus && matchesType;
    });

    // Sort
    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'status':
          aVal = isDeviceOffline(a.lastSeen) ? 1 : 0;
          bVal = isDeviceOffline(b.lastSeen) ? 1 : 0;
          break;
        case 'lastSeen':
          aVal = new Date(a.lastSeen || 0).getTime();
          bVal = new Date(b.lastSeen || 0).getTime();
          break;
        case 'type':
          aVal = (a.type || 'Generic').toLowerCase();
          bVal = (b.type || 'Generic').toLowerCase();
          break;
        default:
          aVal = a.createdAt;
          bVal = b.createdAt;
      }
      if (sortOrder === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    return result;
  }, [devices, searchTerm, filterStatus, filterType, sortBy, sortOrder]);

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never';
    const diff = Date.now() - new Date(lastSeen).getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const stats = useMemo(() => ({
    total: devices.length,
    online: devices.filter(d => !isDeviceOffline(d.lastSeen) && d.status !== 'offline').length,
    offline: devices.filter(d => isDeviceOffline(d.lastSeen) || d.status === 'offline').length
  }), [devices]);

  const hasActiveFilters = searchTerm || filterStatus !== 'all' || filterType !== 'all';

  const toggleSelectAll = () => {
    if (selectedDevices.length === filteredDevices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(filteredDevices.map(d => d.deviceId));
    }
  };

  const toggleSelectDevice = (deviceId) => {
    setSelectedDevices(prev => 
      prev.includes(deviceId) 
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Devices</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {stats.total} devices · {stats.online} online
          </p>
        </div>
        <Link to="/app/devices/register">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
            <Plus size={16} />
            Add Device
          </button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <button 
          onClick={() => setFilterStatus('all')}
          className={`text-left bg-white dark:bg-neutral-900 border rounded-lg p-4 transition-colors ${
            filterStatus === 'all' 
              ? 'border-neutral-900 dark:border-white' 
              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-3xl font-semibold text-neutral-900 dark:text-white">{stats.total}</span>
            <Cpu size={20} className="text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">All Devices</p>
        </button>

        <button 
          onClick={() => setFilterStatus('online')}
          className={`text-left bg-white dark:bg-neutral-900 border rounded-lg p-4 transition-colors ${
            filterStatus === 'online' 
              ? 'border-emerald-500' 
              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-semibold text-neutral-900 dark:text-white">{stats.online}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <Wifi size={20} className="text-emerald-500" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Online</p>
        </button>

        <button 
          onClick={() => setFilterStatus('offline')}
          className={`text-left bg-white dark:bg-neutral-900 border rounded-lg p-4 transition-colors ${
            filterStatus === 'offline' 
              ? 'border-neutral-500' 
              : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-3xl font-semibold text-neutral-900 dark:text-white">{stats.offline}</span>
            <WifiOff size={20} className="text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Offline</p>
        </button>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-3 p-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name or ID..."
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
            {deviceTypes.length > 1 && (
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border-0 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
              >
                <option value="all">All Types</option>
                {deviceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            )}

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border-0 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
            >
              <option value="lastSeen-desc">Last Active</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="status-asc">Online First</option>
              <option value="status-desc">Offline First</option>
            </select>

            {/* View Toggle */}
            <div className="flex items-center bg-neutral-50 dark:bg-neutral-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-neutral-700 shadow-sm' : ''}`}
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

            <button
              onClick={fetchDevices}
              className="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedDevices.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {selectedDevices.length} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedDevices([])}
                className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                Clear
              </button>
              <button
                onClick={bulkDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-neutral-100 dark:border-neutral-800">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              Showing {filteredDevices.length} of {devices.length} devices
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterType('all');
              }}
              className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Device List */}
      {filteredDevices.length > 0 ? (
        viewMode === 'table' ? (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedDevices.length === filteredDevices.length && filteredDevices.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 accent-neutral-900 dark:accent-white"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      Device
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider hidden md:table-cell">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider hidden lg:table-cell">
                      Last Active
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredDevices.map((device) => {
                    const offline = isDeviceOffline(device.lastSeen);
                    const deviceId = device.deviceId;
                    const isSelected = selectedDevices.includes(deviceId);
                    
                    return (
                      <tr 
                        key={deviceId}
                        className={`group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${
                          isSelected ? 'bg-neutral-50 dark:bg-neutral-800/30' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectDevice(deviceId)}
                            className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 accent-neutral-900 dark:accent-white"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`/app/devices/${deviceId}`} className="flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              offline 
                                ? 'bg-neutral-100 dark:bg-neutral-800' 
                                : 'bg-emerald-50 dark:bg-emerald-500/10'
                            }`}>
                              {offline 
                                ? <WifiOff size={14} className="text-neutral-400" />
                                : <Wifi size={14} className="text-emerald-500" />
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-neutral-900 dark:text-white truncate group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
                                {device.name}
                              </p>
                              <p className="text-xs text-neutral-400 font-mono truncate">
                                {deviceId.slice(0, 20)}...
                              </p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                            {device.type || 'Generic'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                            offline ? 'text-neutral-500' : 'text-emerald-600 dark:text-emerald-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${offline ? 'bg-neutral-400' : 'bg-emerald-500'}`} />
                            {offline ? 'Offline' : 'Online'}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-sm text-neutral-500 dark:text-neutral-400">
                            {formatLastSeen(device.lastSeen)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => copyDeviceId(deviceId, e)}
                              className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
                              title="Copy ID"
                            >
                              <Copy size={14} />
                            </button>
                            <Link
                              to={`/app/devices/${deviceId}`}
                              className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
                              title="View Details"
                            >
                              <ExternalLink size={14} />
                            </Link>
                            <button
                              onClick={(e) => deleteDevice(deviceId, e)}
                              className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDevices.map((device) => {
              const offline = isDeviceOffline(device.lastSeen);
              const deviceId = device.deviceId;
              
              return (
                <Link
                  key={deviceId}
                  to={`/app/devices/${deviceId}`}
                  className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      offline 
                        ? 'bg-neutral-100 dark:bg-neutral-800' 
                        : 'bg-emerald-50 dark:bg-emerald-500/10'
                    }`}>
                      {offline 
                        ? <WifiOff size={18} className="text-neutral-400" />
                        : <Wifi size={18} className="text-emerald-500" />
                      }
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      offline 
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500' 
                        : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500'
                    }`}>
                      {offline ? 'Offline' : 'Online'}
                    </span>
                  </div>
                  
                  <h3 className="font-medium text-neutral-900 dark:text-white group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors truncate">
                    {device.name}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {device.type || 'Generic'}
                  </p>
                  
                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                    <span className="text-xs text-neutral-400 font-mono truncate max-w-[50%]">
                      {deviceId.slice(0, 12)}...
                    </span>
                    <span className="text-xs text-neutral-500">
                      {formatLastSeen(device.lastSeen)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-16 text-center">
          <div className="w-14 h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
            <Cpu className="w-7 h-7 text-neutral-400" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            {hasActiveFilters ? 'No devices found' : 'No devices yet'}
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mb-6 text-sm">
            {hasActiveFilters 
              ? 'Try adjusting your search or filters.'
              : 'Get started by registering your first IoT device.'
            }
          </p>
          {!hasActiveFilters ? (
            <Link to="/app/devices/register">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors">
                <Plus size={16} />
                Add Device
              </button>
            </Link>
          ) : (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterType('all');
              }}
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

export default Devices;
