/**
 * Alert Rules Routes
 * API endpoints for managing device alert rules
 */

const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/auth');
const { sendSuccess, sendError, asyncHandler } = require('../utils/responses');
const alertRuleService = require('../services/alertRuleService');

/**
 * @route POST /api/alert-rules
 * @desc Create a new alert rule
 * @access Private
 */
router.post('/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // Verify user has access to the device
    const deviceId = req.body.deviceId;
    if (deviceId) {
      const deviceService = require('../services/deviceService');
      try {
        await deviceService.getDeviceByIdForUser(deviceId, req.user.userId, req.user.role);
      } catch (error) {
        return sendError(res, 'You do not have access to this device', 403);
      }
      
      // Check canModifyAlertRules permission for sub-users
      if (req.user.role === 'sub-user') {
        const devicePermissionService = require('../services/devicePermissionService');
        const hasPermission = await devicePermissionService.checkPermission(
          req.user.userId,
          deviceId,
          'canModifyAlertRules'
        );
        if (!hasPermission) {
          return sendError(res, 'You do not have permission to modify alert rules for this device', 403);
        }
      }
    }

    try {
      const rule = await alertRuleService.createAlertRule(req.user.userId, req.body);
      sendSuccess(res, { rule }, 'Alert rule created successfully', 201);
    } catch (error) {
      console.error('Create alert rule error:', error);
      sendError(res, error.message || 'Failed to create alert rule', 500);
    }
  })
);



/**
 * @route GET /api/alert-rules
 * @desc Get all alert rules for the authenticated user
 * @access Private
 */
router.get('/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const { deviceId } = req.query;
      const rules = await alertRuleService.getUserAlertRules(req.user.userId, deviceId);
      sendSuccess(res, { rules, total: rules.length }, 'Alert rules retrieved successfully');
    } catch (error) {
      console.error('Get alert rules error:', error);
      sendError(res, 'Failed to get alert rules', 500);
    }
  })
);

/**
 * @route GET /api/alert-rules/device/:deviceId/summary
 * @desc Get alert rules summary for a device
 * @access Private
 */
router.get('/device/:deviceId/summary',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const summary = await alertRuleService.getDeviceRulesSummary(req.params.deviceId, req.user.userId);
      sendSuccess(res, { summary }, 'Alert rules summary retrieved successfully');
    } catch (error) {
      console.error('Get device alert rules summary error:', error);
      sendError(res, error.message || 'Failed to retrieve alert rules summary', 500);
    }
  })
);

/**
 * @route GET /api/alert-rules/device/:deviceId/datastream/:pin
 * @desc Get alert rules for a specific datastream
 * @access Private
 */
router.get('/device/:deviceId/datastream/:pin',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const { deviceId, pin } = req.params;
      const rules = await alertRuleService.getDatastreamRules(deviceId, req.user.userId, pin);
      sendSuccess(res, { rules }, 'Datastream alert rules retrieved successfully');
    } catch (error) {
      console.error('Get datastream alert rules error:', error);
      sendError(res, error.message || 'Failed to retrieve datastream alert rules', 500);
    }
  })
);

/**
 * @route GET /api/alert-rules/:ruleId
 * @desc Get alert rule by ID
 * @access Private
 */
router.get('/:ruleId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const rule = await alertRuleService.getAlertRuleById(req.params.ruleId);
      
      if (!rule) {
        return sendError(res, 'Alert rule not found', 404);
      }
      
      // Verify ownership
      if (rule.userId !== req.user.userId) {
        return sendError(res, 'Access denied', 403);
      }

      sendSuccess(res, { rule }, 'Alert rule retrieved successfully');
    } catch (error) {
      console.error('Get alert rule error:', error);
      sendError(res, error.message || 'Failed to retrieve alert rule', 500);
    }
  })
);

/**
 * @route PUT /api/alert-rules/:ruleId
 * @desc Update alert rule
 * @access Private
 */
router.put('/:ruleId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // Get the existing rule to check device access
    const existingRule = await alertRuleService.getAlertRuleById(req.params.ruleId);
    if (!existingRule) {
      return sendError(res, 'Alert rule not found', 404);
    }
    
    // Verify ownership
    if (existingRule.userId !== req.user.userId) {
      return sendError(res, 'Access denied', 403);
    }
    
    // Check canModifyAlertRules permission for sub-users
    if (req.user.role === 'sub-user') {
      const devicePermissionService = require('../services/devicePermissionService');
      const hasPermission = await devicePermissionService.checkPermission(
        req.user.userId,
        existingRule.deviceId,
        'canModifyAlertRules'
      );
      if (!hasPermission) {
        return sendError(res, 'You do not have permission to modify alert rules for this device', 403);
      }
    }
    
    try {
      const rule = await alertRuleService.updateAlertRule(req.params.ruleId, req.user.userId, req.body);
      sendSuccess(res, { rule }, 'Alert rule updated successfully');
    } catch (error) {
      console.error('Update alert rule error:', error);
      sendError(res, error.message || 'Failed to update alert rule', 500);
    }
  })
);



/**
 * @route DELETE /api/alert-rules/:ruleId
 * @desc Delete an alert rule
 * @access Private
 */
router.delete('/:ruleId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // Get the existing rule to check device access
    const existingRule = await alertRuleService.getAlertRuleById(req.params.ruleId);
    if (!existingRule) {
      return sendError(res, 'Alert rule not found', 404);
    }
    
    // Verify ownership
    if (existingRule.userId !== req.user.userId) {
      return sendError(res, 'Access denied', 403);
    }
    
    // Check canModifyAlertRules permission for sub-users
    if (req.user.role === 'sub-user') {
      const devicePermissionService = require('../services/devicePermissionService');
      const hasPermission = await devicePermissionService.checkPermission(
        req.user.userId,
        existingRule.deviceId,
        'canModifyAlertRules'
      );
      if (!hasPermission) {
        return sendError(res, 'You do not have permission to modify alert rules for this device', 403);
      }
    }
    
    try {
      await alertRuleService.deleteAlertRule(req.params.ruleId, req.user.userId);
      sendSuccess(res, null, 'Alert rule deleted successfully');
    } catch (error) {
      console.error('Delete alert rule error:', error);
      sendError(res, error.message || 'Failed to delete alert rule', 500);
    }
  })
);

/**
 * @route POST /api/alert-rules/:ruleId/toggle
 * @desc Toggle alert rule enabled status
 * @access Private
 */
router.post('/:ruleId/toggle',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const rule = await alertRuleService.toggleRule(req.params.ruleId, req.user.userId);
      sendSuccess(res, { rule }, 'Alert rule toggled successfully');
    } catch (error) {
      console.error('Toggle alert rule error:', error);
      sendError(res, error.message || 'Failed to toggle alert rule', 500);
    }
  })
);

module.exports = router;
