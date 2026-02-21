/**
 * Alert Rules API Service
 * Client-side API for managing device alert rules
 */

import { apiRequest, API_BASE_URL } from './apiHelpers';

export const alertRuleAPI = {
  /**
   * Create a new alert rule
   */
  createRule: async (ruleData) => {
    const response = await apiRequest(`${API_BASE_URL}/alert-rules`, {
      method: 'POST',
      body: JSON.stringify(ruleData)
    });
    return response;
  },

  /**
   * Get all alert rules (optionally filtered by device)
   */
  getRules: async (deviceId = null) => {
    const url = deviceId 
      ? `${API_BASE_URL}/alert-rules?deviceId=${deviceId}`
      : `${API_BASE_URL}/alert-rules`;
    
    const response = await apiRequest(url);
    return response;
  },

  /**
   * Get device rules summary
   */
  getDeviceRulesSummary: async (deviceId) => {
    const response = await apiRequest(`${API_BASE_URL}/alert-rules/device/${deviceId}/summary`);
    return response;
  },

  /**
   * Get a specific alert rule
   */
  getRule: async (ruleId) => {
    const response = await apiRequest(`${API_BASE_URL}/alert-rules/${ruleId}`);
    return response;
  },

  /**
   * Update an alert rule
   */
  updateRule: async (ruleId, updateData) => {
    const response = await apiRequest(`${API_BASE_URL}/alert-rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    return response;
  },

  /**
   * Toggle rule enabled/disabled
   */
  toggleRule: async (ruleId) => {
    const response = await apiRequest(`${API_BASE_URL}/alert-rules/${ruleId}/toggle`, {
      method: 'POST'
    });
    return response;
  },

  /**
   * Delete an alert rule
   */
  deleteRule: async (ruleId) => {
    const response = await apiRequest(`${API_BASE_URL}/alert-rules/${ruleId}`, {
      method: 'DELETE'
    });
    return response;
  },

  /**
   * Get rules for a specific datastream
   */
  getDatastreamRules: async (deviceId, pin) => {
    const response = await apiRequest(`${API_BASE_URL}/alert-rules/device/${deviceId}/datastream/${pin}`);
    return response;
  }
};
