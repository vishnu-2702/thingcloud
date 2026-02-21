import { handleResponse, getAuthHeaders, API_BASE_URL } from './apiHelpers';

export const alertAPI = {
  // Get all alerts for the authenticated user
  getAlerts: async () => {
    const response = await fetch(`${API_BASE_URL}/alerts`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Mark alert as read
  markAsRead: async (alertId) => {
    const response = await fetch(`${API_BASE_URL}/alerts/${alertId}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Delete an alert
  deleteAlert: async (alertId) => {
    const response = await fetch(`${API_BASE_URL}/alerts/${alertId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Create a new alert
  createAlert: async (alertData) => {
    const response = await fetch(`${API_BASE_URL}/alerts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(alertData),
    });
    return handleResponse(response);
  },
};
