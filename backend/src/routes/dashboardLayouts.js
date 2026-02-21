/**
 * Dashboard Layout Routes
 * API endpoints for managing device-specific dashboard layouts
 */

const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const { sendSuccess, sendError, asyncHandler } = require('../utils/responses');
const dashboardLayoutService = require('../services/dashboardLayoutService');
const deviceService = require('../services/deviceService');
const templateService = require('../services/templateService');

/**
 * @route GET /api/dashboard-layouts/widget-types
 * @desc Get available widget types
 * @access Private
 */
router.get('/widget-types',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const widgetTypes = dashboardLayoutService.getWidgetTypes();
    sendSuccess(res, { widgetTypes }, 'Widget types retrieved successfully');
  })
);

/**
 * @route GET /api/dashboard-layouts/:deviceId
 * @desc Get dashboard layout for a device
 * @access Private
 */
router.get('/:deviceId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { deviceId } = req.params;
    const { generateDefault } = req.query;

    // Verify user has access to the device
    try {
      await deviceService.getDeviceByIdForUser(deviceId, req.user.userId, req.user.role);
    } catch (error) {
      return sendError(res, 'You do not have access to this device', 403);
    }

    // Get existing layout
    let layout = await dashboardLayoutService.getLayout(deviceId);

    // If no layout exists and generateDefault is true, generate one
    if (!layout && generateDefault === 'true') {
      const device = await deviceService.getDeviceById(deviceId);
      
      if (device && device.templateId) {
        const template = await templateService.getTemplateById(device.templateId);
        layout = dashboardLayoutService.generateDefaultLayout(template, deviceId);
        layout.isDefault = true;
      } else {
        layout = {
          deviceId,
          widgets: [],
          gridCols: 12,
          rowHeight: 50,
          isDefault: true
        };
      }
    }

    if (!layout) {
      return sendSuccess(res, { layout: null, exists: false }, 'No dashboard layout found');
    }

    sendSuccess(res, { layout, exists: !layout.isDefault }, 'Dashboard layout retrieved successfully');
  })
);

/**
 * @route POST /api/dashboard-layouts/:deviceId
 * @desc Save or update dashboard layout for a device
 * @access Private
 */
router.post('/:deviceId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { deviceId } = req.params;
    const { widgets, gridCols, rowHeight, name } = req.body;

    // Verify user has access to the device
    const device = await deviceService.getDeviceByIdForUser(deviceId, req.user.userId, req.user.role);

    // Check if user is admin or device owner
    if (req.user.role === 'sub-user') {
      // Check canControl permission for sub-users
      const devicePermissionService = require('../services/devicePermissionService');
      const hasPermission = await devicePermissionService.checkPermission(
        req.user.userId,
        deviceId,
        'canControl'
      );
      if (!hasPermission) {
        return sendError(res, 'You do not have permission to customize this device dashboard', 403);
      }
    }

    try {
      const layout = await dashboardLayoutService.saveLayout(deviceId, req.user.userId, {
        widgets,
        gridCols,
        rowHeight,
        name
      });

      sendSuccess(res, { layout }, 'Dashboard layout saved successfully', 201);
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
      sendError(res, error.message || 'Failed to save dashboard layout', 400);
    }
  })
);

/**
 * @route DELETE /api/dashboard-layouts/:deviceId
 * @desc Delete dashboard layout for a device (reset to default)
 * @access Private
 */
router.delete('/:deviceId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { deviceId } = req.params;

    // Verify user has access to the device
    await deviceService.getDeviceByIdForUser(deviceId, req.user.userId, req.user.role);

    // Check if user is admin or device owner
    if (req.user.role === 'sub-user') {
      const devicePermissionService = require('../services/devicePermissionService');
      const hasPermission = await devicePermissionService.checkPermission(
        req.user.userId,
        deviceId,
        'canControl'
      );
      if (!hasPermission) {
        return sendError(res, 'You do not have permission to reset this device dashboard', 403);
      }
    }

    try {
      await dashboardLayoutService.deleteLayout(deviceId, req.user.userId);
      sendSuccess(res, null, 'Dashboard layout reset to default');
    } catch (error) {
      if (error.message === 'Dashboard layout not found') {
        return sendSuccess(res, null, 'No custom layout to reset');
      }
      throw error;
    }
  })
);

/**
 * @route POST /api/dashboard-layouts/:deviceId/generate-default
 * @desc Generate default layout based on template
 * @access Private
 */
router.post('/:deviceId/generate-default',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { deviceId } = req.params;

    // Verify user has access to the device
    const device = await deviceService.getDeviceByIdForUser(deviceId, req.user.userId, req.user.role);

    let template = null;
    if (device.templateId) {
      template = await templateService.getTemplateById(device.templateId);
    }

    const layout = dashboardLayoutService.generateDefaultLayout(template, deviceId);
    
    sendSuccess(res, { layout }, 'Default layout generated successfully');
  })
);

/**
 * @route POST /api/dashboard-layouts/:deviceId/clone
 * @desc Clone layout from another device
 * @access Private
 */
router.post('/:deviceId/clone',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { deviceId } = req.params;
    const { sourceDeviceId } = req.body;

    if (!sourceDeviceId) {
      return sendError(res, 'Source device ID is required', 400);
    }

    // Verify user has access to both devices
    await deviceService.getDeviceByIdForUser(deviceId, req.user.userId, req.user.role);
    await deviceService.getDeviceByIdForUser(sourceDeviceId, req.user.userId, req.user.role);

    try {
      const layout = await dashboardLayoutService.cloneLayout(sourceDeviceId, deviceId, req.user.userId);
      sendSuccess(res, { layout }, 'Dashboard layout cloned successfully', 201);
    } catch (error) {
      console.error('Error cloning dashboard layout:', error);
      sendError(res, error.message || 'Failed to clone dashboard layout', 400);
    }
  })
);

/**
 * @route GET /api/dashboard-layouts/user/all
 * @desc Get all layouts for the current user
 * @access Private
 */
router.get('/user/all',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const layouts = await dashboardLayoutService.getUserLayouts(req.user.userId);
    sendSuccess(res, { layouts, total: layouts.length }, 'User layouts retrieved successfully');
  })
);

module.exports = router;
