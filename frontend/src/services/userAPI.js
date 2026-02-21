import { handleResponse, getAuthHeaders, API_BASE_URL } from './apiHelpers';

export const userAPI = {
  // Get user profile
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  },

  // Get user statistics
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/users/stats`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get user events
  getEvents: async (limit = 10) => {
    const response = await fetch(`${API_BASE_URL}/users/events?limit=${limit}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get analytics data
  getAnalytics: async (timeRange = '24h') => {
    const response = await fetch(`${API_BASE_URL}/users/analytics?timeRange=${timeRange}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get user settings
  getSettings: async () => {
    const response = await fetch(`${API_BASE_URL}/users/settings`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Update user settings
  updateSettings: async (settingsData) => {
    const response = await fetch(`${API_BASE_URL}/users/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settingsData),
    });
    return handleResponse(response);
  },

  // Get all sub-users for the current admin
  getSubUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users/sub-users`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get a specific sub-user
  getSubUser: async (subUserId) => {
    const response = await fetch(`${API_BASE_URL}/users/sub-users/${subUserId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Create a new sub-user
  createSubUser: async (subUserData) => {
    const response = await fetch(`${API_BASE_URL}/users/sub-users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(subUserData),
    });
    return handleResponse(response);
  },

  // Update sub-user
  updateSubUser: async (subUserId, updateData) => {
    const response = await fetch(`${API_BASE_URL}/users/sub-users/${subUserId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    });
    return handleResponse(response);
  },

  // Delete sub-user
  deleteSubUser: async (subUserId) => {
    const response = await fetch(`${API_BASE_URL}/users/sub-users/${subUserId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Grant device access to sub-user
  grantDeviceAccess: async (subUserId, deviceId, permissions) => {
    const response = await fetch(`${API_BASE_URL}/users/sub-users/${subUserId}/devices`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ deviceId, permissions }),
    });
    return handleResponse(response);
  },

  // Revoke device access from sub-user
  revokeDeviceAccess: async (subUserId, deviceId) => {
    const response = await fetch(`${API_BASE_URL}/users/sub-users/${subUserId}/devices/${deviceId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
