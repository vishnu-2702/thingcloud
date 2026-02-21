/**
 * Validation Middleware
 * Request data validation using Joi schemas
 */

const { sendValidationError } = require('../utils/responses');

/**
 * Validate request body middleware
 * @param {Object} schema - Joi validation schema
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return sendValidationError(res, error);
    }
    
    req.body = value; // Use validated and sanitized data
    next();
  };
};

/**
 * Validate query parameters middleware
 * @param {Object} schema - Joi validation schema
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);
    
    if (error) {
      return sendValidationError(res, error);
    }
    
    req.query = value; // Use validated and sanitized data
    next();
  };
};

/**
 * Validate route parameters middleware
 * @param {Object} schema - Joi validation schema
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params);
    
    if (error) {
      return sendValidationError(res, error);
    }
    
    req.params = value; // Use validated and sanitized data
    next();
  };
};

module.exports = {
  validateBody,
  validateQuery,
  validateParams
};