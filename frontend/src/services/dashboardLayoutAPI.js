/**
 * Dashboard Layout API Service
 * Client-side API for managing device dashboard layouts
 */

import { apiRequest, API_BASE_URL } from './apiHelpers';

export const dashboardLayoutAPI = {
  /**
   * Get available widget types
   */
  getWidgetTypes: async () => {
    const response = await apiRequest(`${API_BASE_URL}/dashboard-layouts/widget-types`);
    return response;
  },

  /**
   * Get dashboard layout for a device
   * @param {string} deviceId - Device ID
   * @param {boolean} generateDefault - Whether to generate default layout if none exists
   */
  getLayout: async (deviceId, generateDefault = false) => {
    const url = generateDefault 
      ? `${API_BASE_URL}/dashboard-layouts/${deviceId}?generateDefault=true`
      : `${API_BASE_URL}/dashboard-layouts/${deviceId}`;
    const response = await apiRequest(url);
    return response;
  },

  /**
   * Save dashboard layout for a device
   * @param {string} deviceId - Device ID
   * @param {object} layoutData - Layout configuration
   */
  saveLayout: async (deviceId, layoutData) => {
    const response = await apiRequest(`${API_BASE_URL}/dashboard-layouts/${deviceId}`, {
      method: 'POST',
      body: JSON.stringify(layoutData)
    });
    return response;
  },

  /**
   * Delete dashboard layout (reset to default)
   * @param {string} deviceId - Device ID
   */
  deleteLayout: async (deviceId) => {
    const response = await apiRequest(`${API_BASE_URL}/dashboard-layouts/${deviceId}`, {
      method: 'DELETE'
    });
    return response;
  },

  /**
   * Generate default layout based on template
   * @param {string} deviceId - Device ID
   */
  generateDefaultLayout: async (deviceId) => {
    const response = await apiRequest(`${API_BASE_URL}/dashboard-layouts/${deviceId}/generate-default`, {
      method: 'POST'
    });
    return response;
  },

  /**
   * Clone layout from another device
   * @param {string} deviceId - Target device ID
   * @param {string} sourceDeviceId - Source device ID
   */
  cloneLayout: async (deviceId, sourceDeviceId) => {
    const response = await apiRequest(`${API_BASE_URL}/dashboard-layouts/${deviceId}/clone`, {
      method: 'POST',
      body: JSON.stringify({ sourceDeviceId })
    });
    return response;
  },

  /**
   * Get all layouts for current user
   */
  getUserLayouts: async () => {
    const response = await apiRequest(`${API_BASE_URL}/dashboard-layouts/user/all`);
    return response;
  }
};
