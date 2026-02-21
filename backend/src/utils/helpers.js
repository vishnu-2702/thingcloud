/**
 * General Utilities
 * Common utility functions
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Generate UUID
 * @returns {string} UUID
 */
const generateId = () => {
  return uuidv4();
};

/**
 * Get current timestamp
 * @returns {string} Current timestamp in ISO 8601 format
 */
const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Format device data for API response
 * @param {Object} device - Device object from database
 * @returns {Object} Formatted device object
 */
const formatDeviceData = (device) => {
  return {
    id: device.deviceId,
    deviceId: device.deviceId,
    name: device.name,
    type: device.type,
    description: device.description,
    templateId: device.templateId,
    status: device.status,
    lastSeen: device.lastSeen,
    createdAt: device.createdAt,
    updatedAt: device.updatedAt,
    ...(device.apiKey && { apiKey: device.apiKey })
  };
};

/**
 * Format user data for API response (remove sensitive data)
 * @param {Object} user - User object from database
 * @returns {Object} Formatted user object
 */
const formatUserData = (user) => {
  const { password, ...userWithoutPassword } = user;
  return {
    userId: user.userId,
    email: user.email,
    name: user.name,
    role: user.role || 'user',
    status: user.status || 'active',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    deviceCount: user.deviceCount || 0,
    ...(user.preferences && { preferences: user.preferences })
  };
};

/**
 * Format template data for API response
 * @param {Object} template - Template object from database
 * @returns {Object} Formatted template object
 */
const formatTemplateData = (template) => {
  return {
    id: template.templateId,
    templateId: template.templateId,
    name: template.name,
    description: template.description,
    category: template.category || 'general',
    datastreams: template.datastreams || [],
    usage: template.usage || 0,
    isPublic: template.isPublic || false,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt
  };
};

/**
 * Validate pin data against template
 * @param {Object} data - Telemetry data
 * @param {Object} template - Device template
 * @returns {Object} Validation result
 */
const validateTelemetryData = (data, template) => {
  if (!template || !template.datastreams) {
    return { isValid: true, errors: [] };
  }

  const errors = [];
  const templatePins = template.datastreams.map(stream => stream.virtualPin || stream.pin).filter(Boolean);
  const dataPins = Object.keys(data);
  
  // Check for invalid pins
  const invalidPins = dataPins.filter(pin => !templatePins.includes(pin));
  if (invalidPins.length > 0) {
    errors.push({
      type: 'invalid_pins',
      message: 'Data contains pins not defined in template',
      invalidPins,
      expectedPins: templatePins
    });
  }

  // Validate data types
  for (const stream of template.datastreams) {
    const pin = stream.virtualPin || stream.pin;
    if (data[pin] !== undefined) {
      const value = data[pin];
      const dataType = stream.type || stream.dataType;
      
      // Type validation
      if (!isValidType(value, dataType)) {
        errors.push({
          type: 'type_mismatch',
          pin,
          expectedType: dataType,
          receivedType: typeof value,
          receivedValue: value
        });
      }
      
      // Range validation for numbers
      if ((dataType === 'number' || dataType === 'integer') && typeof value === 'number') {
        if (stream.min !== undefined && value < stream.min) {
          errors.push({
            type: 'range_error',
            pin,
            message: `Value below minimum`,
            min: stream.min,
            receivedValue: value
          });
        }
        
        if (stream.max !== undefined && value > stream.max) {
          errors.push({
            type: 'range_error',
            pin,
            message: `Value above maximum`,
            max: stream.max,
            receivedValue: value
          });
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Check if value matches expected data type
 * @param {*} value - Value to check
 * @param {string} expectedType - Expected data type
 * @returns {boolean} Type match result
 */
const isValidType = (value, expectedType) => {
  switch (expectedType) {
    case 'number':
    case 'integer':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean' || value === 0 || value === 1;
    case 'string':
      return typeof value === 'string';
    default:
      return true;
  }
};

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Sleep promise
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Sanitize input string
 * @param {string} input - Input string
 * @returns {string} Sanitized string
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Check if device should be considered offline based on lastSeen timestamp
 * Uses 5-minute threshold: if device hasn't sent data in 5+ minutes, it's offline
 * @param {number|null} lastSeen - Device's lastSeen timestamp in milliseconds
 * @returns {boolean} True if device should be offline, false otherwise
 */
const isDeviceOffline = (lastSeen) => {
  if (!lastSeen) return true;
  const OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds
  return (Date.now() - lastSeen) > OFFLINE_THRESHOLD;
};

/**
 * Get device effective status considering lastSeen timestamp
 * Priority: lastSeen check > device.status
 * @param {Object} device - Device object with status and lastSeen properties
 * @returns {string} Effective device status ('online' or 'offline')
 */
const getDeviceEffectiveStatus = (device) => {
  if (isDeviceOffline(device.lastSeen)) {
    return 'offline';
  }
  return device.status || 'offline';
};

module.exports = {
  generateId,
  getCurrentTimestamp,
  formatDeviceData,
  formatUserData,
  formatTemplateData,
  validateTelemetryData,
  isValidType,
  sleep,
  sanitizeInput,
  isDeviceOffline,
  getDeviceEffectiveStatus
};