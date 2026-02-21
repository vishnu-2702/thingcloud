import { handleResponse, getAuthHeaders, API_BASE_URL } from './apiHelpers';

export const deviceAPI = {
  // Get all devices for the authenticated user
  getDevices: async () => {
    const response = await fetch(`${API_BASE_URL}/devices`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get a specific device by ID
  getDevice: async (deviceId, includeApiKey = false) => {
    const url = includeApiKey ? 
      `${API_BASE_URL}/devices/${deviceId}?includeApiKey=true` : 
      `${API_BASE_URL}/devices/${deviceId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Register a new device
  registerDevice: async (deviceData) => {
    const response = await fetch(`${API_BASE_URL}/devices`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(deviceData),
    });
    return handleResponse(response);
  },

  // Update device configuration
  updateDevice: async (deviceId, deviceData) => {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(deviceData),
    });
    return handleResponse(response);
  },

  // Regenerate device API key
  regenerateApiKey: async (deviceId) => {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/regenerate-key`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Delete a device
  deleteDevice: async (deviceId) => {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get device telemetry data
  getTelemetry: async (deviceId, limit = 10) => {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/telemetry?limit=${limit}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get device telemetry data with time range
  getDeviceTelemetry: async (deviceId, timeRange = '1h') => {
    // timeRange can be a string like '24h', '7d', '30d', '3m' or a number interpreted as limit
    const params = new URLSearchParams();

    if (typeof timeRange === 'string') {
      const now = Date.now();
      let start = null;
      if (timeRange.endsWith('h')) {
        const hours = parseInt(timeRange.replace('h', ''), 10);
        start = now - hours * 60 * 60 * 1000;
      } else if (timeRange.endsWith('d')) {
        const days = parseInt(timeRange.replace('d', ''), 10);
        start = now - days * 24 * 60 * 60 * 1000;
      } else if (timeRange.endsWith('m')) {
        const months = parseInt(timeRange.replace('m', ''), 10);
        start = now - months * 30 * 24 * 60 * 60 * 1000;
      }

      if (start) {
        params.set('startTime', String(start));
        params.set('endTime', String(now));
        // set a high limit to capture the range
        params.set('limit', '10000');
      } else {
        // fallback to limit when unknown string
        params.set('limit', '100');
      }
    } else if (typeof timeRange === 'number') {
      params.set('limit', String(timeRange));
    } else {
      params.set('limit', '100');
    }

    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/telemetry?${params.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Send command to device
  sendCommand: async (deviceId, command) => {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/command`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ command }),
    });
    return handleResponse(response);
  },

  // Send test data to device
  sendTestData: async (deviceId) => {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/test-data`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Update virtual pin value
  updateVirtualPin: async (deviceId, pin, value) => {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/pins/${pin}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ value }),
    });
    return handleResponse(response);
  },

  // Get virtual pin values
  getVirtualPins: async (deviceId) => {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/pins`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
