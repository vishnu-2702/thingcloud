/**
 * Authentication Middleware
 * JWT and device API key authentication
 */

const { verifyToken } = require('../utils/auth');
const { sendError } = require('../utils/responses');
const { dynamodb, TABLES } = require('../config/database');
const { QueryCommand } = require('@aws-sdk/lib-dynamodb');

/**
 * Authenticate JWT token middleware
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return sendError(res, 'Access token required', 401);
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT authentication error:', error.message);
    return sendError(res, 'Invalid or expired token', 403);
  }
};

/**
 * Authenticate device API key middleware
 */
const authenticateDevice = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    console.log('[Auth] Device authentication attempt, API Key:', apiKey ? apiKey.substring(0, 8) + '...' : 'MISSING');
    
    if (!apiKey) {
      console.warn('[Auth] No API key provided');
      return sendError(res, 'API key required', 401);
    }

    const command = new QueryCommand({
      TableName: TABLES.DEVICES,
      IndexName: 'ApiKeyIndex',
      KeyConditionExpression: 'apiKey = :apiKey',
      ExpressionAttributeValues: {
        ':apiKey': apiKey
      }
    });

    const result = await dynamodb.send(command);
    
    if (result.Items.length === 0) {
      console.warn('[Auth] Invalid API key:', apiKey.substring(0, 8) + '...');
      return sendError(res, 'Invalid API key', 401);
    }

    req.device = result.Items[0];
    console.log('[Auth] Device authenticated:', req.device.deviceId, req.device.name);
    next();
  } catch (error) {
    console.error('[Auth] Device authentication error:', error);
    console.error('[Auth] Error details:', error.message, error.stack);
    return sendError(res, 'Authentication failed', 500);
  }
};

/**
 * Role-based authorization middleware
 * @param {Array<string>} allowedRoles - Array of allowed roles
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required', 401);
    }

    const userRole = req.user.role || 'user';
    if (!allowedRoles.includes(userRole)) {
      return sendError(res, 'Insufficient permissions', 403);
    }

    next();
  };
};

/**
 * Require admin role
 */
const requireAdmin = () => {
  return requireRole(['admin']);
};

/**
 * Device access authorization middleware
 * Checks if user has permission to access a specific device
 */
const requireDeviceAccess = (permissionType = 'canView') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return sendError(res, 'Authentication required', 401);
      }

      const deviceId = req.params.deviceId || req.body.deviceId;
      if (!deviceId) {
        return sendError(res, 'Device ID required', 400);
      }

      // Admins can access all their own devices
      if (req.user.role === 'admin') {
        // Will be verified in the device service
        return next();
      }

      // Sub-users need explicit permission
      if (req.user.role === 'sub-user') {
        const devicePermissionService = require('../services/devicePermissionService');
        
        // Check if user has the required permission
        const hasPermission = await devicePermissionService.checkPermission(
          req.user.userId,
          deviceId,
          permissionType
        );

        if (!hasPermission) {
          return sendError(res, 'You do not have permission to access this device', 403);
        }

        req.devicePermission = await devicePermissionService.getDevicePermission(
          req.user.userId,
          deviceId
        );
        return next();
      }

      return sendError(res, 'Insufficient permissions', 403);
    } catch (error) {
      console.error('Device access check error:', error);
      return sendError(res, 'Permission check failed', 500);
    }
  };
};

/**
 * Optional authentication middleware
 * Sets req.user if token is valid, but doesn't fail if no token
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

module.exports = {
  authenticateToken,
  authenticateDevice,
  requireRole,
  requireAdmin,
  requireDeviceAccess,
  optionalAuth
};