/**
 * Device Routes
 * Device management endpoints
 */

const express = require('express');
const router = express.Router();

const deviceService = require('../services/deviceService');
const telemetryService = require('../services/telemetryService');
const userService = require('../services/userService');
const { validateBody, validateQuery } = require('../middleware/validation');
const { authenticateToken, requireDeviceAccess } = require('../middleware/auth');
const { sendSuccess, sendError, asyncHandler } = require('../utils/responses');
const { getDeviceEffectiveStatus } = require('../utils/helpers');
const schemas = require('../validators/schemas');

/**
 * @route GET /api/devices
 * @desc Get user's devices
 * @access Private
 */
router.get('/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const devices = await deviceService.getUserDevices(req.user.userId, req.user.role);
    // Apply effective status based on lastSeen (5-minute check)
    const devicesWithStatus = devices.map(device => ({
      ...device,
      status: getDeviceEffectiveStatus(device)
    }));
    sendSuccess(res, { devices: devicesWithStatus });
  })
);

/**
 * @route POST /api/devices
 * @desc Create a new device
 * @access Private
 */
router.post('/',
  authenticateToken,
  validateBody(schemas.device),
  asyncHandler(async (req, res) => {
    try {
      const device = await deviceService.createDevice(req.user.userId, req.body);
      
      // Increment user device count
      await userService.incrementDeviceCount(req.user.userId);
      
      // Increment template usage count if device uses a template
      if (device.templateId) {
        const templateService = require('../services/templateService');
        await templateService.incrementUsage(device.templateId);
      }
      
      // Emit real-time event
      if (req.app.locals.socketHandler) {
        req.app.locals.socketHandler.emitDeviceRegistered(req.user.userId, {
          id: device.deviceId,
          deviceId: device.deviceId,
          name: device.name,
          type: device.type,
          status: device.status,
          createdAt: device.createdAt
        });
      }
      
      sendSuccess(res, { device }, 'Device created successfully', 201);
    } catch (error) {
      sendError(res, 'Failed to create device', 500);
    }
  })
);

/**
 * @route GET /api/devices/:deviceId
 * @desc Get device details with template
 * @access Private
 */
router.get('/:deviceId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { deviceId } = req.params;
    const { includeApiKey } = req.query;
    
    const device = await deviceService.getDeviceByIdForUser(deviceId, req.user.userId, req.user.role);
    
    // Sub-users cannot see API keys
    const canSeeApiKey = req.user.role !== 'sub-user' && includeApiKey === 'true';
    
    // Fetch template if device has one
    let template = null;
    if (device.templateId) {
      const templateService = require('../services/templateService');
      try {
        template = await templateService.getTemplateById(device.templateId);
      } catch (error) {
        console.error('Template fetch error:', error.message);
        // Continue without template if not found
      }
    }
    
    // Format device data with effective status
    const deviceData = {
      ...device,
      status: getDeviceEffectiveStatus(device),
      ...(canSeeApiKey && { apiKey: device.apiKey })
    };
    
    sendSuccess(res, { 
      device: deviceData, 
      template 
    });
  })
);

/**
 * @route PUT /api/devices/:deviceId
 * @desc Update device
 * @access Private
 */
router.put('/:deviceId',
  authenticateToken,
  validateBody(schemas.deviceUpdate),
  asyncHandler(async (req, res) => {
    try {
      const { deviceId } = req.params;
      const device = await deviceService.updateDevice(deviceId, req.user.userId, req.body);
      sendSuccess(res, { device }, 'Device updated successfully');
    } catch (error) {
      if (error.message === 'Device not found') {
        return sendError(res, error.message, 404);
      }
      if (error.message === 'Access denied') {
        return sendError(res, error.message, 403);
      }
      sendError(res, 'Failed to update device', 500);
    }
  })
);

/**
 * @route POST /api/devices/:deviceId/regenerate-key
 * @desc Regenerate device API key
 * @access Private (Device owner only)
 */
router.post('/:deviceId/regenerate-key',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // Sub-users cannot regenerate API keys
    if (req.user.role === 'sub-user') {
      return sendError(res, 'Sub-users cannot regenerate API keys. Please contact your administrator.', 403);
    }
    
    try {
      const { deviceId } = req.params;
      const result = await deviceService.regenerateApiKey(deviceId, req.user.userId);
      sendSuccess(res, { apiKey: result.apiKey }, 'API key regenerated successfully');
    } catch (error) {
      if (error.message === 'Device not found') {
        return sendError(res, error.message, 404);
      }
      if (error.message === 'Access denied') {
        return sendError(res, error.message, 403);
      }
      sendError(res, 'Failed to regenerate API key', 500);
    }
  })
);

/**
 * @route DELETE /api/devices/:deviceId
 * @desc Delete device
 * @access Private (Admins only - sub-users cannot delete devices)
 */
router.delete('/:deviceId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // Sub-users cannot delete devices
    if (req.user.role === 'sub-user') {
      return sendError(res, 'Sub-users cannot delete devices. Please contact your administrator.', 403);
    }
    
    try {
      const { deviceId } = req.params;
      const result = await deviceService.deleteDevice(deviceId, req.user.userId);
      
      // Decrement user device count
      await userService.decrementDeviceCount(req.user.userId);
      
      sendSuccess(res, null, result.message);
    } catch (error) {
      if (error.message === 'Device not found') {
        return sendError(res, error.message, 404);
      }
      if (error.message === 'Access denied') {
        return sendError(res, error.message, 403);
      }
      sendError(res, 'Failed to delete device', 500);
    }
  })
);

/**
 * @route GET /api/devices/:deviceId/telemetry
 * @desc Get device telemetry data
 * @access Private
 */
router.get('/:deviceId/telemetry',
  authenticateToken,
  requireDeviceAccess('canViewTelemetry'),
  validateQuery(schemas.telemetryQuery),
  asyncHandler(async (req, res) => {
    try {
      const { deviceId } = req.params;
      
      // Verify device access (already checked by middleware, but get device info)
      await deviceService.getDeviceByIdForUser(deviceId, req.user.userId, req.user.role);
      
      const telemetry = await telemetryService.getDeviceTelemetry(deviceId, req.query);
      sendSuccess(res, { telemetry });
    } catch (error) {
      if (error.message === 'Device not found') {
        return sendError(res, error.message, 404);
      }
      if (error.message === 'Access denied') {
        return sendError(res, error.message, 403);
      }
      sendError(res, 'Failed to fetch telemetry data', 500);
    }
  })
);

/**
 * @route GET /api/devices/:deviceId/pins
 * @desc Get device pin states
 * @access Private
 */
router.get('/:deviceId/pins',
  authenticateToken,
  requireDeviceAccess('canViewTelemetry'),
  asyncHandler(async (req, res) => {
    try {
      const { deviceId } = req.params;
      
      const device = await deviceService.getDeviceByIdForUser(deviceId, req.user.userId, req.user.role);
      const pinData = await telemetryService.getDevicePinStates(deviceId, device.templateId);
      
      sendSuccess(res, pinData);
    } catch (error) {
      if (error.message === 'Device not found') {
        return sendError(res, error.message, 404);
      }
      if (error.message === 'Access denied') {
        return sendError(res, error.message, 403);
      }
      sendError(res, 'Failed to fetch pin data', 500);
    }
  })
);

/**
 * @route PUT /api/devices/:deviceId/pins/:pin
 * @desc Update device pin value
 * @access Private
 */
router.put('/:deviceId/pins/:pin',
  authenticateToken,
  requireDeviceAccess('canControl'),
  validateBody(schemas.pinUpdate),
  asyncHandler(async (req, res) => {
    try {
      const { deviceId, pin } = req.params;
      const { value } = req.body;
      
      // Verify device access
      await deviceService.getDeviceByIdForUser(deviceId, req.user.userId, req.user.role);
      
      const result = await telemetryService.storeDeviceCommand(
        deviceId, 
        req.user.userId, 
        { pin, value }
      );
      
      // Emit real-time update
      if (req.app.locals.socketHandler) {
        req.app.locals.socketHandler.emitPinUpdated(deviceId, req.user.userId, pin, value, result.timestamp);
      }
      
      sendSuccess(res, result, 'Pin value updated successfully');
    } catch (error) {
      if (error.message === 'Device not found') {
        return sendError(res, error.message, 404);
      }
      if (error.message === 'Access denied') {
        return sendError(res, error.message, 403);
      }
      sendError(res, 'Failed to update pin value', 500);
    }
  })
);

/**
 * @route POST /api/devices/:deviceId/command
 * @desc Send command to device
 * @access Private
 */
router.post('/:deviceId/command',
  authenticateToken,
  requireDeviceAccess('canControl'),
  validateBody(schemas.deviceCommand),
  asyncHandler(async (req, res) => {
    try {
      const { deviceId } = req.params;
      
      // Verify device access
      await deviceService.getDeviceByIdForUser(deviceId, req.user.userId, req.user.role);
      
      const result = await telemetryService.storeDeviceCommand(
        deviceId,
        req.user.userId,
        req.body
      );
      
      // Emit real-time command
      if (req.app.locals.socketHandler) {
        // Use the telemetry emit method for command feedback
        req.app.locals.socketHandler.emitTelemetryData(
          deviceId, 
          req.user.userId, 
          { command: req.body.command, parameters: req.body.parameters }, 
          result.timestamp
        );
      }
      
      sendSuccess(res, result, 'Command sent successfully');
    } catch (error) {
      if (error.message === 'Device not found') {
        return sendError(res, error.message, 404);
      }
      if (error.message === 'Access denied') {
        return sendError(res, error.message, 403);
      }
      sendError(res, 'Failed to send command', 500);
    }
  })
);

/**
 * @route POST /api/devices/:deviceId/test-data
 * @desc Send test telemetry data
 * @access Private
 */
router.post('/:deviceId/test-data',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const { deviceId } = req.params;
      
      const device = await deviceService.getDeviceByIdForUser(deviceId, req.user.userId);
      const result = await telemetryService.storeTestData(device);
      
      sendSuccess(res, {
        telemetryId: result.telemetryId,
        data: deviceService.generateSampleData(),
        timestamp: Date.now()
      }, 'Test telemetry data sent successfully');
    } catch (error) {
      if (error.message === 'Device not found') {
        return sendError(res, error.message, 404);
      }
      if (error.message === 'Access denied') {
        return sendError(res, error.message, 403);
      }
      sendError(res, 'Failed to send test data', 500);
    }
  })
);

module.exports = router;