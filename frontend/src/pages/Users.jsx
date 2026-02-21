import React, { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, 
  Search, 
  UserPlus,
  Edit,
  Trash2,
  Shield,
  Mail,
  Eye,
  Activity,
  Bell,
  Settings,
  X,
  Cpu,
  MoreVertical
} from 'lucide-react';
import { userAPI } from '../services/userAPI';
import { deviceAPI } from '../services/deviceAPI';
import toast from 'react-hot-toast';

const Users = () => {
  const [subUsers, setSubUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    devicePermissions: {} // Store per-device permissions: { deviceId: { canView: true, ... } }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subUsersData, devicesData] = await Promise.all([
        userAPI.getSubUsers(),
        deviceAPI.getDevices()
      ]);
      setSubUsers(subUsersData.subUsers || []);
      setDevices(devicesData.devices || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubUser = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    const deviceIds = Object.keys(formData.devicePermissions);
    if (deviceIds.length === 0) {
      toast.error('Please assign at least one device');
      return;
    }

    try {
      // Send data with deviceIds and devicePermissions arrays
      await userAPI.createSubUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        deviceIds,
        devicePermissions: formData.devicePermissions
      });
      toast.success('Sub-user created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error creating sub-user:', error);
      toast.error(error.response?.data?.message || 'Error creating sub-user');
    }
  };

  const handleEditSubUser = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    const deviceIds = Object.keys(formData.devicePermissions);

    try {
      await userAPI.updateSubUser(selectedUser.userId, {
        deviceIds,
        devicePermissions: formData.devicePermissions
      });
      toast.success('Sub-user updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error updating sub-user:', error);
      toast.error(error.response?.data?.message || 'Error updating sub-user');
    }
  };

  const handleDeleteSubUser = async (subUserId) => {
    if (!confirm('Are you sure you want to delete this sub-user? This will revoke all device access.')) {
      return;
    }

    try {
      await userAPI.deleteSubUser(subUserId);
      setSubUsers(prev => prev.filter(user => user.userId !== subUserId));
      toast.success('Sub-user deleted successfully');
    } catch (error) {
      console.error('Error deleting sub-user:', error);
      toast.error('Error deleting sub-user');
    }
  };

  const openEditModal = async (user) => {
    try {
      const response = await userAPI.getSubUser(user.userId);
      const userData = response.subUser;
      const assignedDevices = response.assignedDevices || [];
      
      // Build per-device permissions object
      const devicePermissions = {};
      assignedDevices.forEach(device => {
        devicePermissions[device.deviceId] = device.permissions || {
          canView: true,
          canControl: false,
          canViewTelemetry: true,
          canViewAlerts: true,
          canModifyAlertRules: false
        };
      });
      
      setSelectedUser(userData);
      setFormData({
        name: userData.name,
        email: userData.email,
        password: '',
        devicePermissions
      });
      setShowEditModal(true);
    } catch (error) {
      console.error('Error loading sub-user details:', error);
      toast.error('Error loading sub-user details');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      devicePermissions: {}
    });
  };

  const toggleDeviceSelection = (deviceId) => {
    setFormData(prev => {
      const newPermissions = { ...prev.devicePermissions };
      
      if (newPermissions[deviceId]) {
        // Remove device
        delete newPermissions[deviceId];
      } else {
        // Add device with default permissions
        newPermissions[deviceId] = {
          canView: true,
          canControl: false,
          canViewTelemetry: true,
          canViewAlerts: true,
          canModifyAlertRules: false
        };
      }
      
      return {
        ...prev,
        devicePermissions: newPermissions
      };
    });
  };

  const togglePermission = (deviceId, permissionKey) => {
    setFormData(prev => ({
      ...prev,
      devicePermissions: {
        ...prev.devicePermissions,
        [deviceId]: {
          ...prev.devicePermissions[deviceId],
          [permissionKey]: !prev.devicePermissions[deviceId]?.[permissionKey]
        }
      }
    }));
  };

  const getPermissionIcon = (key) => {
    switch (key) {
      case 'canView': return <Eye size={16} />;
      case 'canControl': return <Settings size={16} />;
      case 'canViewTelemetry': return <Activity size={16} />;
      case 'canViewAlerts': return <Bell size={16} />;
      case 'canModifyAlertRules': return <Shield size={16} />;
      default: return null;
    }
  };

  const getPermissionLabel = (key) => {
    switch (key) {
      case 'canView': return 'View Device';
      case 'canControl': return 'Control Device';
      case 'canViewTelemetry': return 'View Telemetry';
      case 'canViewAlerts': return 'View Alerts';
      case 'canModifyAlertRules': return 'Modify Alert Rules';
      default: return key;
    }
  };

  const filteredSubUsers = subUsers.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-neutral-300 dark:border-neutral-600 border-t-black dark:border-t-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-white">Users</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Manage sub-users and device permissions
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-black dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sub-Users Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800">
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Devices
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider hidden sm:table-cell">
                Permissions
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {filteredSubUsers.map((user) => (
              <tr key={user.userId} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-sm font-medium text-black dark:text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-black dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-black dark:text-white">
                    {user.deviceCount || 0}
                  </span>
                </td>
                <td className="px-4 py-4 hidden sm:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {user.permissions?.canView && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs rounded">
                        <Eye className="w-3 h-3" /> View
                      </span>
                    )}
                    {user.permissions?.canControl && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs rounded">
                        <Settings className="w-3 h-3" /> Control
                      </span>
                    )}
                    {user.permissions?.canViewTelemetry && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs rounded">
                        <Activity className="w-3 h-3" /> Data
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-2 text-neutral-400 hover:text-black dark:hover:text-white transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSubUser(user.userId)}
                      className="p-2 text-neutral-400 hover:text-red-500 transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredSubUsers.length === 0 && (
          <div className="p-12 text-center">
            <UsersIcon className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-black dark:text-white mb-1">No users found</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {searchTerm
                ? 'No sub-users match your search.'
                : 'Create your first sub-user to get started.'}
            </p>
          </div>
        )}
      </div>

      {/* Create Sub-User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl w-full max-w-xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-lg font-semibold text-black dark:text-white">Create User</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubUser} className="overflow-y-auto max-h-[calc(90vh-130px)]">
              <div className="p-6 space-y-4">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-black dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-black dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-black dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
                    placeholder="Min 8 characters"
                  />
                </div>

                {/* Device Assignment */}
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1.5">
                    Device Permissions
                  </label>
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg divide-y divide-neutral-200 dark:divide-neutral-800 max-h-64 overflow-y-auto">
                    {devices.length === 0 ? (
                      <p className="text-sm text-neutral-500 text-center py-6">
                        No devices available
                      </p>
                    ) : (
                      devices.map(device => {
                        const isSelected = !!formData.devicePermissions[device.deviceId];
                        const permissions = formData.devicePermissions[device.deviceId] || {};
                        
                        return (
                          <div key={device.deviceId} className="p-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleDeviceSelection(device.deviceId)}
                                className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-neutral-500 focus:ring-offset-0 focus:ring-1"
                              />
                              <Cpu className="w-4 h-4 text-neutral-400" />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-black dark:text-white">{device.name}</div>
                                <div className="text-xs text-neutral-500">{device.templateName}</div>
                              </div>
                            </label>
                            
                            {isSelected && (
                              <div className="mt-2 ml-7 pl-3 border-l border-neutral-200 dark:border-neutral-700 space-y-1">
                                {['canView', 'canControl', 'canViewTelemetry', 'canViewAlerts', 'canModifyAlertRules'].map(permKey => (
                                  <label key={permKey} className="flex items-center gap-2 py-1 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={permissions[permKey] || false}
                                      onChange={() => togglePermission(device.deviceId, permKey)}
                                      className="w-3.5 h-3.5 rounded border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-neutral-500 focus:ring-offset-0 focus:ring-1"
                                    />
                                    <span className="text-xs text-neutral-600 dark:text-neutral-400">
                                      {getPermissionLabel(permKey)}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Sub-User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl w-full max-w-xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-lg font-semibold text-black dark:text-white">
                Edit User
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="p-1 text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubUser} className="overflow-y-auto max-h-[calc(90vh-130px)]">
              <div className="p-6 space-y-4">
                {/* User Info */}
                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-sm font-medium text-black dark:text-white">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-black dark:text-white">{selectedUser.name}</div>
                      <div className="text-xs text-neutral-500">{selectedUser.email}</div>
                    </div>
                  </div>
                </div>

                {/* Device Assignment */}
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-1.5">
                    Device Permissions
                  </label>
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg divide-y divide-neutral-200 dark:divide-neutral-800 max-h-64 overflow-y-auto">
                    {devices.length === 0 ? (
                      <p className="text-sm text-neutral-500 text-center py-6">
                        No devices available
                      </p>
                    ) : (
                      devices.map(device => {
                        const isSelected = !!formData.devicePermissions[device.deviceId];
                        const permissions = formData.devicePermissions[device.deviceId] || {};
                        
                        return (
                          <div key={device.deviceId} className="p-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleDeviceSelection(device.deviceId)}
                                className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-neutral-500 focus:ring-offset-0 focus:ring-1"
                              />
                              <Cpu className="w-4 h-4 text-neutral-400" />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-black dark:text-white">{device.name}</div>
                                <div className="text-xs text-neutral-500">{device.description || 'No description'}</div>
                              </div>
                            </label>

                            {isSelected && (
                              <div className="mt-2 ml-7 pl-3 border-l border-neutral-200 dark:border-neutral-700 space-y-1">
                                {['canView', 'canControl', 'canViewTelemetry', 'canViewAlerts', 'canModifyAlertRules'].map(permKey => (
                                  <label key={permKey} className="flex items-center gap-2 py-1 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={permissions[permKey] || false}
                                      onChange={() => togglePermission(device.deviceId, permKey)}
                                      className="w-3.5 h-3.5 rounded border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-neutral-500 focus:ring-offset-0 focus:ring-1"
                                    />
                                    <span className="text-xs text-neutral-600 dark:text-neutral-400">
                                      {getPermissionLabel(permKey)}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
