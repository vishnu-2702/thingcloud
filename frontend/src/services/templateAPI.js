import { handleResponse, getAuthHeaders, API_BASE_URL } from './apiHelpers';

export const templateAPI = {
  // Get all templates
  getTemplates: async () => {
    const response = await fetch(`${API_BASE_URL}/templates`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get a specific template by ID
  getTemplate: async (templateId) => {
    const response = await fetch(`${API_BASE_URL}/templates/${templateId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Create a new template
  createTemplate: async (templateData) => {
    const response = await fetch(`${API_BASE_URL}/templates`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(templateData),
    });
    return handleResponse(response);
  },

  // Update template
  updateTemplate: async (templateId, templateData) => {
    const response = await fetch(`${API_BASE_URL}/templates/${templateId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(templateData),
    });
    return handleResponse(response);
  },

  // Delete a template
  deleteTemplate: async (templateId) => {
    const response = await fetch(`${API_BASE_URL}/templates/${templateId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Clone a template
  cloneTemplate: async (templateId, name) => {
    const response = await fetch(`${API_BASE_URL}/templates/${templateId}/clone`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    return handleResponse(response);
  },
};

