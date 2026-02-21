/**
 * Alert Routes
 * Alert management endpoints
 */

const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const { sendSuccess, sendError, asyncHandler } = require('../utils/responses');
const alertService = require('../services/alertService');

/**
 * @route GET /api/alerts
 * @desc Get all alerts for the authenticated user
 * @access Private
 */
router.get('/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { severity, status, unreadOnly, limit } = req.query;
    
    const options = {
      severity: severity || null,
      status: status || null,
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit) : 50
    };

    let alerts = [];
    let targetUserId = req.user.userId;
    
    try {
      // Set a timeout for the entire operation (8 seconds for Vercel limit)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 8000)
      );

      const fetchPromise = (async () => {
        // For sub-users, get alerts from the admin's account
        if (req.user.role === 'sub-user') {
          const userService = require('../services/userService');
          const devicePermissionService = require('../services/devicePermissionService');
          
          // Get the admin (parent user)
          const subUser = await userService.getUserById(req.user.userId);
          if (subUser && subUser.adminId) {
            targetUserId = subUser.adminId;
          }
          
          // Get all alerts from the admin
          alerts = await alertService.getUserAlerts(targetUserId, options);
          
          // Filter to only show alerts for devices the sub-user has canViewAlerts permission
          const accessibleDevices = await devicePermissionService.getUserAccessibleDevices(req.user.userId);
          const accessibleDeviceIds = accessibleDevices
            .filter(d => d.permissions && d.permissions.canViewAlerts)
            .map(d => d.deviceId);
          
          alerts = alerts.filter(alert => 
            alert.deviceId && accessibleDeviceIds.includes(alert.deviceId)
          );
        } else {
          // Admins get all their alerts
          alerts = await alertService.getUserAlerts(targetUserId, options);
        }
        
        const unreadCount = await alertService.getUnreadCount(targetUserId);
        
        return { alerts, unreadCount };
      })();

      const result = await Promise.race([fetchPromise, timeoutPromise]);
      
      return sendSuccess(res, { 
        alerts: result.alerts, 
        unreadCount: result.unreadCount,
        total: result.alerts.length 
      }, 'Alerts retrieved successfully');
    } catch (error) {
      if (error.message === 'Request timeout') {
        console.error('[Alerts API] Request timed out');
        // Return empty alerts instead of error to prevent frontend issues
        return sendSuccess(res, { 
          alerts: [], 
          unreadCount: 0,
          total: 0 
        }, 'Alerts retrieved (timeout, showing cached data)');
      }
      throw error;
    }
  })
);

/**
 * @route POST /api/alerts
 * @desc Create a new alert
 * @access Private
 */
router.post('/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const alert = await alertService.createAlert(req.user.userId, req.body);
    
    // Emit real-time notification via WebSocket
    if (req.app.get('io')) {
      req.app.get('io').to(`user:${req.user.userId}`).emit('newAlert', alert);
    }
    
    return sendSuccess(res, { alert }, 'Alert created successfully', 201);
  })
);

/**
 * @route PUT /api/alerts/:alertId/read
 * @desc Mark an alert as read
 * @access Private
 */
router.put('/:alertId/read',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const alert = await alertService.markAsRead(req.params.alertId, req.user.userId);
    
    return sendSuccess(res, { alert }, 'Alert marked as read');
  })
);

/**
 * @route PUT /api/alerts/read-all
 * @desc Mark all alerts as read
 * @access Private
 */
router.put('/read-all',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const result = await alertService.markAllAsRead(req.user.userId);
    return sendSuccess(res, result, 'All alerts marked as read');
  })
);

/**
 * @route PUT /api/alerts/:alertId/resolve
 * @desc Resolve an alert
 * @access Private
 */
router.put('/:alertId/resolve',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const alert = await alertService.resolveAlert(req.params.alertId, req.user.userId);
    
    // Emit real-time update via WebSocket
    if (req.app.get('io')) {
      req.app.get('io').to(`user:${req.user.userId}`).emit('alertResolved', req.params.alertId);
    }
    
    return sendSuccess(res, { alert }, 'Alert resolved successfully');
  })
);

/**
 * @route DELETE /api/alerts/:alertId
 * @desc Delete an alert
 * @access Private
 */
router.delete('/:alertId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    await alertService.deleteAlert(req.params.alertId, req.user.userId);
    return sendSuccess(res, null, 'Alert deleted successfully');
  })
);

/**
 * @route GET /api/alerts/unread/count
 * @desc Get unread alert count
 * @access Private
 */
router.get('/unread/count',
  authenticateToken,
  asyncHandler(async (req, res) => {
    let targetUserId = req.user.userId;
    
    try {
      // Set a timeout (5 seconds)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );

      const countPromise = (async () => {
        // For sub-users, count from admin's alerts filtered by accessible devices
        if (req.user.role === 'sub-user') {
          const userService = require('../services/userService');
          const devicePermissionService = require('../services/devicePermissionService');
          
          const subUser = await userService.getUserById(req.user.userId);
          if (subUser && subUser.adminId) {
            targetUserId = subUser.adminId;
            
            // Get unread alerts from admin
            const alerts = await alertService.getUserAlerts(targetUserId, { unreadOnly: true });
            
            // Filter by accessible devices with canViewAlerts permission
            const accessibleDevices = await devicePermissionService.getUserAccessibleDevices(req.user.userId);
            const accessibleDeviceIds = accessibleDevices
              .filter(d => d.permissions && d.permissions.canViewAlerts)
              .map(d => d.deviceId);
            
            const filteredAlerts = alerts.filter(alert => 
              alert.deviceId && accessibleDeviceIds.includes(alert.deviceId)
            );
            
            return filteredAlerts.length;
          }
        }
        
        return await alertService.getUnreadCount(targetUserId);
      })();

      const unreadCount = await Promise.race([countPromise, timeoutPromise]);
      return sendSuccess(res, { unreadCount }, 'Unread count retrieved successfully');
    } catch (error) {
      if (error.message === 'Request timeout') {
        console.error('[Alerts API] Unread count request timed out');
        // Return 0 instead of error to prevent frontend issues
        return sendSuccess(res, { unreadCount: 0 }, 'Unread count retrieved (timeout)');
      }
      throw error;
    }
  })
);

module.exports = router;
