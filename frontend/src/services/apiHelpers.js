/**
 * API Helper Utilities
 * Shared utilities for API services
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Handle API responses
 * Backend returns: { success: true, data: {...}, message: '...' }
 * This function extracts the data property
 */
export const handleResponse = async (response) => {
  if (!response.ok) {
    let error;
    try {
      error = await response.json();
    } catch (jsonError) {
      // Response is not JSON
      const text = await response.text().catch(() => 'Network error');
      console.error('[API] Non-JSON error response:', { status: response.status, text });
      throw new Error(`Server error (${response.status}): ${text}`);
    }
    console.error('[API] Error response:', { status: response.status, error });
    throw new Error(error.error || error.message || 'Something went wrong');
  }
  
  try {
    const result = await response.json();
    // Backend wraps data in { success: true, data: {...}, message: '...' }
    // Return the data property if it exists, otherwise return the whole result
    return result.data !== undefined ? result.data : result;
  } catch (jsonError) {
    console.error('[API] Failed to parse success response as JSON:', jsonError);
    throw new Error('Invalid response format from server');
  }
};

/**
 * Get authentication headers
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Get API base URL
 */
export const getApiBaseUrl = () => API_BASE_URL;

/**
 * Generic API request helper
 */
export const apiRequest = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  });
  return handleResponse(response);
};

export default {
  handleResponse,
  getAuthHeaders,
  getApiBaseUrl,
  apiRequest,
  API_BASE_URL
};
