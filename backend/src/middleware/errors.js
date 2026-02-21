/**
 * Error Handling Middleware
 * Global error handling and logging
 */

const config = require('../config/app');
const { sendError } = require('../utils/responses');

/**
 * Request timeout middleware
 */
const requestTimeout = (req, res, next) => {
  // Longer timeout for telemetry endpoint (IoT devices can be slow)
  const timeout = req.path.startsWith('/api/telemetry') 
    ? 30000 // 30 seconds for IoT devices
    : config.SECURITY.REQUEST_TIMEOUT;
  
  req.setTimeout(timeout, () => {
    if (!res.headersSent) {
      return sendError(res, 'Request timeout', 408);
    }
  });
  
  res.setTimeout(timeout, () => {
    if (!res.headersSent) {
      return sendError(res, 'Response timeout', 408);
    }
  });
  
  next();
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    };
    
    // Log errors and slow requests
    if (res.statusCode >= 400) {
      console.warn('Request error:', logData);
    } else if (duration > 1000) {
      console.warn('Slow request:', logData);
    } else if (config.IS_DEVELOPMENT) {
      console.log('Request:', logData);
    }
  });
  
  next();
};

/**
 * Global error handler middleware
 */
const errorHandler = (error, req, res, next) => {
  console.error('Unhandled error:', error);

  // Default error response
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'File too large';
  }

  // Send error response
  return sendError(res, message, statusCode, config.IS_DEVELOPMENT ? error.stack : null);
};

/**
 * 404 handler middleware
 */
const notFoundHandler = (req, res) => {
  return sendError(res, `Route ${req.method} ${req.path} not found`, 404);
};

/**
 * Production security middleware
 */
const productionSecurity = (req, res, next) => {
  if (config.IS_PRODUCTION) {
    // Skip HTTPS redirect for telemetry endpoint (IoT devices need direct access)
    if (req.path.startsWith('/api/telemetry')) {
      return next();
    }
    
    // Force HTTPS in production for other endpoints
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
  }
  
  next();
};

module.exports = {
  requestTimeout,
  requestLogger,
  errorHandler,
  notFoundHandler,
  productionSecurity
};