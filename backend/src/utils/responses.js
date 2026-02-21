/**
 * Response Utilities
 * Standard response formatting utilities
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
    ...(data && { data })
  };
  
  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {*} details - Additional error details
 */
const sendError = (res, message = 'Internal Server Error', statusCode = 500, details = null) => {
  const response = {
    success: false,
    error: message,
    ...(details && process.env.NODE_ENV === 'development' && { details })
  };
  
  return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {Object} validationError - Joi validation error
 */
const sendValidationError = (res, validationError) => {
  const message = validationError.details[0].message;
  return sendError(res, message, 400);
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Data array
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 */
const sendPaginatedResponse = (res, data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  const response = {
    success: true,
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    }
  };
  
  return res.json(response);
};

/**
 * Handle async route errors
 * @param {Function} fn - Async route handler
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError,
  sendPaginatedResponse,
  asyncHandler
};