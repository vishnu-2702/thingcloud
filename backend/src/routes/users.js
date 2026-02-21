/**
 * User Routes
 * User profile and settings endpoints
 */

const express = require('express');
const router = express.Router();

const userService = require('../services/userService');
const deviceService = require('../services/deviceService');
const devicePermissionService = require('../services/devicePermissionService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { sendSuccess, sendError, asyncHandler } = require('../utils/responses');
const { validateBody } = require('../middleware/validation');
const { isDeviceOffline } = require('../utils/helpers');
const schemas = require('../validators/schemas');

/**
 * @route GET /api/users/profile
 * @desc Get user profile
 * @access Private
 */
router.get('/profile',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const user = await userService.getUserById(req.user.userId);
      if (!user) {
        return sendError(res, 'User not found', 404);
      }
      sendSuccess(res, { user });
    } catch (error) {
      sendError(res, 'Failed to get user profile', 500);
    }
  })
);

/**
 * @route PUT /api/users/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile',
  authenticateToken,
  validateBody(schemas.userProfile),
  asyncHandler(async (req, res) => {
    try {
      const updatedUser = await userService.updateProfile(req.user.userId, req.body);
      sendSuccess(res, { user: updatedUser }, 'Profile updated successfully');
    } catch (error) {
      sendError(res, 'Failed to update profile', 500);
    }
  })
);

/**
 * @route GET /api/users/stats
 * @desc Get user statistics with historical comparison
 * @access Private
 */
router.get('/stats',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const user = await userService.getUserById(req.user.userId);
      const devices = await deviceService.getUserDevices(req.user.userId, req.user.role);
      const templateService = require('../services/templateService');
      const telemetryService = require('../services/telemetryService');
      
      // Get user's templates
      const templates = await templateService.getUserTemplates(req.user.userId);
      
      // Count online devices based on lastSeen (5-minute threshold)
      const onlineDevices = devices.filter(d => 
        !isDeviceOffline(d.lastSeen) && d.status !== 'offline'
      ).length;
      
      // Calculate time ranges
      const now = Date.now();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
      
      // Count devices created this week and month
      const devicesThisWeek = devices.filter(d => new Date(d.createdAt) >= weekAgo).length;
      const devicesThisMonth = devices.filter(d => new Date(d.createdAt) >= monthAgo).length;
      
      // Count templates created this month
      const templatesThisMonth = templates.filter(t => new Date(t.createdAt) >= monthAgo).length;
      
      // Count telemetry points for today and yesterday
      let todayTelemetry = 0;
      let yesterdayTelemetry = 0;
      
      for (const device of devices) {
        try {
          // Today's telemetry
          const todayData = await telemetryService.getDeviceTelemetry(device.deviceId, {
            startTime: todayStart.getTime(),
            endTime: now,
            limit: 1000
          });
          todayTelemetry += todayData.length;
          
          // Yesterday's telemetry
          const yesterdayData = await telemetryService.getDeviceTelemetry(device.deviceId, {
            startTime: yesterdayStart.getTime(),
            endTime: todayStart.getTime(),
            limit: 1000
          });
          yesterdayTelemetry += yesterdayData.length;
        } catch (error) {
          console.error(`Error counting telemetry for device ${device.deviceId}:`, error);
        }
      }
      
      // Calculate percentage changes
      const telemetryChange = yesterdayTelemetry > 0 
        ? ((todayTelemetry - yesterdayTelemetry) / yesterdayTelemetry * 100).toFixed(1)
        : (todayTelemetry > 0 ? 100 : 0);
      
      const stats = {
        totalDevices: devices.length,
        onlineDevices: onlineDevices,
        totalTemplates: templates.length,
        activeToday: todayTelemetry,
        // Growth metrics
        devicesThisWeek: devicesThisWeek,
        devicesThisMonth: devicesThisMonth,
        templatesThisMonth: templatesThisMonth,
        telemetryChangePercent: parseFloat(telemetryChange),
        // Calculated metrics
        onlinePercentage: devices.length > 0 ? ((onlineDevices / devices.length) * 100).toFixed(1) : 0,
        accountAge: Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)), // days
        lastLogin: user.updatedAt || user.createdAt
      };
      
      sendSuccess(res, { stats }, 'Statistics retrieved successfully');
    } catch (error) {
      console.error('Stats error:', error);
      sendError(res, 'Failed to get statistics', 500);
    }
  })
);

/**
 * @route GET /api/users/events
 * @desc Get user activity events
 * @access Private
 */
router.get('/events',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    
    try {
      const devices = await deviceService.getUserDevices(req.user.userId, req.user.role);
      const telemetryService = require('../services/telemetryService');
      
      // Generate activity events from device activity
      const events = [];
      
      // Add device status events
      for (const device of devices.slice(0, limit)) {
        if (device.status === 'online' && device.lastSeen) {
          events.push({
            id: `${device.deviceId}-status`,
            type: 'device_connected',
            message: `${device.name} is online`,
            timestamp: device.lastSeen,
            deviceId: device.deviceId
          });
        }
        
        // Add recent telemetry events
        try {
          const recentTelemetry = await telemetryService.getDeviceTelemetry(device.deviceId, { limit: 1 });
          if (recentTelemetry.length > 0) {
            const telemetry = recentTelemetry[0];
            events.push({
              id: `${device.deviceId}-telemetry-${telemetry.timestamp}`,
              type: 'telemetry_received',
              message: `${device.name} sent data`,
              timestamp: telemetry.timestamp,
              deviceId: device.deviceId
            });
          }
        } catch (error) {
          // Skip if no telemetry
        }
      }
      
      // Sort by timestamp descending and limit
      events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const limitedEvents = events.slice(0, limit);
      
      sendSuccess(res, { events: limitedEvents, total: limitedEvents.length }, 'Events retrieved successfully');
    } catch (error) {
      console.error('Events error:', error);
      sendSuccess(res, { events: [], total: 0 }, 'Events retrieved successfully');
    }
  })
);

/**
 * @route GET /api/users/analytics
 * @desc Get comprehensive analytics data
 * @access Private
 */
router.get('/analytics',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const { timeRange = '24h' } = req.query;
      const telemetryService = require('../services/telemetryService');
      
      // Parse time range
      const now = Date.now();
      let startTime;
      switch(timeRange) {
        case '24h': startTime = now - (24 * 60 * 60 * 1000); break;
        case '7d': startTime = now - (7 * 24 * 60 * 60 * 1000); break;
        case '30d': startTime = now - (30 * 24 * 60 * 60 * 1000); break;
        case '3m': startTime = now - (90 * 24 * 60 * 60 * 1000); break;
        default: startTime = now - (24 * 60 * 60 * 1000);
      }
      
      // Get devices (filtered by role for sub-users)
      const devices = await deviceService.getUserDevices(req.user.userId, req.user.role);
      
      // Initialize analytics data
      let totalDataPoints = 0;
      let totalErrors = 0;
      const connectivityStats = { online: 0, offline: 0, reconnecting: 0 };
      const deviceStats = [];
      const hourlyDistribution = Array(24).fill(0);
      const dailyDistribution = Array(7).fill(0);
      const deviceComparison = [];
      let responseTimesSum = 0;
      let validDeviceCount = 0;
      
      // Process each device
      for (const device of devices) {
        // Count connectivity based on lastSeen (5-minute threshold)
        const deviceOffline = isDeviceOffline(device.lastSeen);
        
        if (!deviceOffline && device.status === 'online') connectivityStats.online++;
        else if (deviceOffline || device.status === 'offline') connectivityStats.offline++;
        else if (device.status === 'reconnecting') connectivityStats.reconnecting++;
        
        try {
          // Fetch telemetry data (convert timestamps to ISO strings for DynamoDB)
          const telemetry = await telemetryService.getDeviceTelemetry(device.deviceId, {
            startTime,
            endTime: now,
            limit: 10000
          });
          
          const dataPoints = telemetry.length;
          totalDataPoints += dataPoints;
          
          // Count errors (invalid/unvalidated data)
          const errors = telemetry.filter(t => !t.validated).length;
          totalErrors += errors;
          
          // Hourly distribution (handle ISO string timestamps)
          telemetry.forEach(point => {
            const timestamp = typeof point.timestamp === 'string' 
              ? new Date(point.timestamp).getTime() 
              : point.timestamp;
            const hour = new Date(timestamp).getHours();
            if (hour >= 0 && hour < 24) {
              hourlyDistribution[hour]++;
            }
          });
          
          // Daily distribution (last 7 days, handle ISO string timestamps)
          const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
          telemetry.forEach(point => {
            const timestamp = typeof point.timestamp === 'string' 
              ? new Date(point.timestamp).getTime() 
              : point.timestamp;
            if (timestamp >= sevenDaysAgo) {
              const daysAgo = Math.floor((now - timestamp) / (24 * 60 * 60 * 1000));
              if (daysAgo >= 0 && daysAgo < 7) {
                dailyDistribution[6 - daysAgo]++;
              }
            }
          });
          
          // Calculate device-specific metrics (handle ISO string timestamps)
          const hourAgo = now - (60 * 60 * 1000);
          const recentData = telemetry.filter(t => {
            const timestamp = typeof t.timestamp === 'string' 
              ? new Date(t.timestamp).getTime() 
              : t.timestamp;
            return timestamp > hourAgo;
          });
          const dataRate = recentData.length;
          
          const deviceErrorRate = dataPoints > 0 ? (errors / dataPoints) * 100 : 0;
          
          // Calculate response time (inter-arrival time in seconds, handle ISO strings)
          let deviceResponseTime = 0;
          if (telemetry.length > 1) {
            const sorted = [...telemetry].sort((a, b) => {
              const aTime = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp;
              const bTime = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : b.timestamp;
              return aTime - bTime;
            });
            let interArrivalSum = 0;
            for (let i = 1; i < sorted.length; i++) {
              const prevTime = typeof sorted[i - 1].timestamp === 'string' 
                ? new Date(sorted[i - 1].timestamp).getTime() 
                : sorted[i - 1].timestamp;
              const currTime = typeof sorted[i].timestamp === 'string' 
                ? new Date(sorted[i].timestamp).getTime() 
                : sorted[i].timestamp;
              interArrivalSum += (currTime - prevTime);
            }
            // Convert to seconds (timestamps are in milliseconds)
            deviceResponseTime = (interArrivalSum / (sorted.length - 1)) / 1000;
          }
          
          if (dataPoints > 0) {
            responseTimesSum += deviceResponseTime;
            validDeviceCount++;
          }
          
          // Add to device stats (include ALL devices, even with 0 data)
          deviceStats.push({
            deviceId: device.deviceId,
            name: device.name,
            status: device.status,
            lastSeen: device.lastSeen, // Include raw timestamp for offline detection
            dataPoints,
            dataRate,
            errorRate: Number(deviceErrorRate.toFixed(1)),
            responseTime: Math.round(deviceResponseTime), // in seconds
            lastUpdate: device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'
          });
          
          // Add to device comparison (only devices with data)
          if (dataPoints > 0) {
            deviceComparison.push({
              name: device.name.length > 15 ? device.name.substring(0, 15) + '...' : device.name,
              dataPoints,
              dataRate
            });
          }
          
        } catch (error) {
          console.error(`Error processing device ${device.deviceId}:`, error);
          // Still add device to stats even if error occurred
          deviceStats.push({
            deviceId: device.deviceId,
            name: device.name,
            status: device.status,
            lastSeen: device.lastSeen, // Include raw timestamp for offline detection
            dataPoints: 0,
            dataRate: 0,
            errorRate: 0,
            responseTime: 0,
            lastUpdate: device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'
          });
        }
      }
      
      // Calculate overall metrics
      const totalDevices = devices.length;
      const uptime = totalDevices > 0 ? (connectivityStats.online / totalDevices) * 100 : 0;
      const avgDataRate = validDeviceCount > 0 ? (totalDataPoints / validDeviceCount) / 24 : 0;
      const errorRate = totalDataPoints > 0 ? (totalErrors / totalDataPoints) * 100 : 0;
      const avgResponseTime = validDeviceCount > 0 ? responseTimesSum / validDeviceCount : 0;
      const throughput = totalDataPoints / 24; // points per hour
      const reliability = 100 - errorRate;
      
      // Prepare hourly data
      const hourlyData = hourlyDistribution.map((count, hour) => ({
        hour: `${hour}:00`,
        dataPoints: count
      }));
      
      // Prepare daily data
      const dailyData = [];
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dayName = days[date.getDay()];
        const dataPoints = dailyDistribution[i];
        const errors = Math.round((errorRate / 100) * dataPoints);
        
        dailyData.push({
          day: dayName,
          dataPoints,
          errors
        });
      }
      
      // Calculate connectivity percentages
      const connectivityPercentages = {
        online: totalDevices > 0 ? Math.round((connectivityStats.online / totalDevices) * 100) : 0,
        offline: totalDevices > 0 ? Math.round((connectivityStats.offline / totalDevices) * 100) : 0,
        reconnecting: totalDevices > 0 ? Math.round((connectivityStats.reconnecting / totalDevices) * 100) : 0
      };
      
      const analytics = {
        totalDataPoints,
        uptime: Number(uptime.toFixed(1)),
        dataTransmissionRate: Number(avgDataRate.toFixed(1)),
        errorRate: Number(errorRate.toFixed(1)),
        deviceStats: deviceStats, // Return ALL devices (online and offline)
        connectivityStats: {
          ...connectivityStats,
          percentages: connectivityPercentages
        },
        performanceMetrics: {
          avgResponseTime: Math.round(avgResponseTime),
          throughput: Number(throughput.toFixed(1)),
          reliability: Number(reliability.toFixed(1))
        },
        hourlyData,
        dailyData,
        deviceComparison: deviceComparison.slice(0, 5), // Top 5 for chart
        timeRange
      };
      
      sendSuccess(res, { analytics }, 'Analytics data retrieved successfully');
    } catch (error) {
      console.error('Analytics error:', error);
      sendError(res, 'Failed to get analytics data', 500);
    }
  })
);

/**
 * @route GET /api/users/settings
 * @desc Get user settings
 * @access Private
 */
router.get('/settings',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const user = await userService.getUserById(req.user.userId);
      
      // Return user preferences/settings
      const settings = {
        theme: user.preferences?.theme || 'light',
        notifications: user.preferences?.notifications !== false,
        dashboardLayout: user.preferences?.dashboardLayout || 'grid',
        emailNotifications: user.emailNotifications !== false,
        language: user.language || 'en'
      };
      
      sendSuccess(res, settings, 'Settings retrieved successfully');
    } catch (error) {
      sendError(res, 'Failed to get settings', 500);
    }
  })
);

/**
 * @route PUT /api/users/settings
 * @desc Update user settings
 * @access Private
 */
router.put('/settings',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const updatedUser = await userService.updateProfile(req.user.userId, {
        preferences: req.body
      });
      
      sendSuccess(res, { settings: req.body }, 'Settings updated successfully');
    } catch (error) {
      sendError(res, 'Failed to update settings', 500);
    }
  })
);

/**
 * @route GET /api/users/sub-users
 * @desc Get all sub-users for the current admin
 * @access Private (Admin only)
 */
router.get('/sub-users',
  authenticateToken,
  requireAdmin(),
  asyncHandler(async (req, res) => {
    const subUsers = await userService.getSubUsers(req.user.userId);
    
    // Enhance each sub-user with device count
    const enhancedSubUsers = await Promise.all(
      subUsers.map(async (subUser) => {
        try {
          const devices = await devicePermissionService.getUserAccessibleDevices(subUser.userId);
          return {
            ...subUser,
            deviceCount: devices.length,
            permissions: devices[0]?.permissions || null
          };
        } catch (error) {
          console.warn(`Failed to get devices for sub-user ${subUser.userId}:`, error.message);
          return {
            ...subUser,
            deviceCount: 0,
            permissions: null
          };
        }
      })
    );
    
    sendSuccess(res, { subUsers: enhancedSubUsers, total: enhancedSubUsers.length }, 'Sub-users retrieved successfully');
  })
);

/**
 * @route POST /api/users/sub-users
 * @desc Create a new sub-user
 * @access Private (Admin only)
 */
router.post('/sub-users',
  authenticateToken,
  requireAdmin(),
  validateBody(schemas.createSubUser),
  asyncHandler(async (req, res) => {
    const subUser = await userService.createSubUser(req.user.userId, req.body);
    
    // If device permissions are provided (per-device format)
    if (req.body.devicePermissions && typeof req.body.devicePermissions === 'object') {
      const deviceIds = Object.keys(req.body.devicePermissions);
      
      // Grant access to each device with its specific permissions
      for (const deviceId of deviceIds) {
        await devicePermissionService.grantDeviceAccess(
          subUser.userId,
          deviceId,
          req.user.userId,
          req.body.devicePermissions[deviceId]
        );
      }
    }
    // Fallback: Legacy format with deviceIds array and single permissions object
    else if (req.body.deviceIds && req.body.deviceIds.length > 0) {
      await devicePermissionService.grantMultipleDevices(
        subUser.userId,
        req.body.deviceIds,
        req.user.userId,
        req.body.devicePermissions || {}
      );
    }
    
    sendSuccess(res, { subUser }, 'Sub-user created successfully', 201);
  })
);

/**
 * @route GET /api/users/sub-users/:subUserId
 * @desc Get a specific sub-user
 * @access Private (Admin only)
 */
router.get('/sub-users/:subUserId',
  authenticateToken,
  requireAdmin(),
  asyncHandler(async (req, res) => {
    const subUser = await userService.getUserById(req.params.subUserId);
    
    if (!subUser) {
      return sendError(res, 'Sub-user not found', 404);
    }
    
    // Verify ownership
    if (subUser.adminId !== req.user.userId) {
      return sendError(res, 'Access denied', 403);
    }
    
    // Get assigned devices
    const devicePermissions = await devicePermissionService.getUserAccessibleDevices(req.params.subUserId);
    
    sendSuccess(res, {
      subUser,
      assignedDevices: devicePermissions
    }, 'Sub-user details retrieved successfully');
  })
);

/**
 * @route PUT /api/users/sub-users/:subUserId
 * @desc Update sub-user details
 * @access Private (Admin only)
 */
router.put('/sub-users/:subUserId',
  authenticateToken,
  requireAdmin(),
  asyncHandler(async (req, res) => {
    const subUser = await userService.getUserById(req.params.subUserId);
    
    if (!subUser) {
      return sendError(res, 'Sub-user not found', 404);
    }
    
    // Verify ownership
    if (subUser.adminId !== req.user.userId) {
      return sendError(res, 'Access denied', 403);
    }
    
    // Update permissions if provided
    if (req.body.permissions) {
      await userService.updateSubUserPermissions(
        req.user.userId,
        req.params.subUserId,
        req.body.permissions
      );
    }
    
    // Update device assignments if provided
    if (req.body.devicePermissions !== undefined) {
      // Remove all existing permissions
      await devicePermissionService.revokeAllDeviceAccess(req.params.subUserId);
      
      // Grant new permissions per device
      if (typeof req.body.devicePermissions === 'object') {
        const deviceIds = Object.keys(req.body.devicePermissions);
        
        for (const deviceId of deviceIds) {
          await devicePermissionService.grantDeviceAccess(
            req.params.subUserId,
            deviceId,
            req.user.userId,
            req.body.devicePermissions[deviceId]
          );
        }
      }
    }
    // Fallback: Legacy format with deviceIds array
    else if (req.body.deviceIds !== undefined) {
      // Remove all existing permissions
      await devicePermissionService.revokeAllDeviceAccess(req.params.subUserId);
      
      // Grant new permissions
      if (req.body.deviceIds.length > 0) {
        await devicePermissionService.grantMultipleDevices(
          req.params.subUserId,
          req.body.deviceIds,
          req.user.userId,
          req.body.devicePermissions || {}
        );
      }
    }
    
    sendSuccess(res, null, 'Sub-user updated successfully');
  })
);

/**
 * @route DELETE /api/users/sub-users/:subUserId
 * @desc Delete a sub-user
 * @access Private (Admin only)
 */
router.delete('/sub-users/:subUserId',
  authenticateToken,
  requireAdmin(),
  asyncHandler(async (req, res) => {
    // Revoke all device access first
    await devicePermissionService.revokeAllDeviceAccess(req.params.subUserId);
    
    // Delete the sub-user
    await userService.deleteSubUser(req.user.userId, req.params.subUserId);
    
    sendSuccess(res, null, 'Sub-user deleted successfully');
  })
);

/**
 * @route POST /api/users/sub-users/:subUserId/devices
 * @desc Grant device access to a sub-user
 * @access Private (Admin only)
 */
router.post('/sub-users/:subUserId/devices',
  authenticateToken,
  requireAdmin(),
  asyncHandler(async (req, res) => {
    const { deviceId, permissions } = req.body;
    
    const subUser = await userService.getUserById(req.params.subUserId);
    if (!subUser) {
      return sendError(res, 'Sub-user not found', 404);
    }
    
    // Verify ownership
    if (subUser.adminId !== req.user.userId) {
      return sendError(res, 'Access denied', 403);
    }
    
    // Verify device belongs to admin
    const device = await deviceService.getDeviceByIdForUser(deviceId, req.user.userId);
    if (!device) {
      return sendError(res, 'Device not found or access denied', 404);
    }
    
    // Grant access
    await devicePermissionService.grantDeviceAccess(
      req.params.subUserId,
      deviceId,
      req.user.userId,
      permissions || {}
    );
    
    sendSuccess(res, null, 'Device access granted successfully');
  })
);

/**
 * @route DELETE /api/users/sub-users/:subUserId/devices/:deviceId
 * @desc Revoke device access from a sub-user
 * @access Private (Admin only)
 */
router.delete('/sub-users/:subUserId/devices/:deviceId',
  authenticateToken,
  requireAdmin(),
  asyncHandler(async (req, res) => {
    const subUser = await userService.getUserById(req.params.subUserId);
    if (!subUser) {
      return sendError(res, 'Sub-user not found', 404);
    }
    
    // Verify ownership
    if (subUser.adminId !== req.user.userId) {
      return sendError(res, 'Access denied', 403);
    }
    
    // Revoke access
    await devicePermissionService.revokeDeviceAccess(
      req.params.subUserId,
      req.params.deviceId
    );
    
    sendSuccess(res, null, 'Device access revoked successfully');
  })
);

module.exports = router;
