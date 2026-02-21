/**
 * Admin Routes
 * Administrative endpoints for user management
 */

const express = require('express');
const router = express.Router();

const userService = require('../services/userService');
const { validateBody } = require('../middleware/validation');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { sendSuccess, sendError, asyncHandler } = require('../utils/responses');
const schemas = require('../validators/schemas');

/**
 * @route GET /api/admin/users
 * @desc Get all users
 * @access Admin, Manager
 */
router.get('/users',
  authenticateToken,
  requireRole(['admin', 'manager']),
  asyncHandler(async (req, res) => {
    try {
      const users = await userService.getAllUsers();
      sendSuccess(res, { users });
    } catch (error) {
      sendError(res, 'Failed to fetch users', 500);
    }
  })
);

const { dynamodb, TABLES } = require('../config/database');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');

/**
 * @route POST /api/admin/users/invite
 * @desc Invite a new user
 * @access Admin
 */
router.post('/users/invite',
  authenticateToken,
  requireRole(['admin']),
  validateBody(schemas.inviteUser),
  asyncHandler(async (req, res) => {
    try {
      // For now, just create the user directly
      // In a real app, you'd create an invitation and send an email
      const { email, name, role } = req.body;
      
      // Check if user already exists
      const existingUser = await userService.getUserByEmail(email);
      if (existingUser) {
        return sendError(res, 'User with this email already exists', 409);
      }
      
      // Create invitation record
      const invitation = {
        inviteId: require('uuid').v4(),
        email,
        name,
        role,
        status: 'pending',
        invitedBy: req.user.userId,
        createdAt: Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      };

      await dynamodb.send(new PutCommand({
        TableName: TABLES.INVITATIONS,
        Item: invitation
      }));
      
      sendSuccess(res, { invitation }, 'User invitation created successfully', 201);
    } catch (error) {
      console.error('Invite error:', error);
      sendError(res, 'Failed to invite user', 500);
    }
  })
);

/**
 * @route PUT /api/admin/users/:userId/role
 * @desc Update user role
 * @access Admin
 */
router.put('/users/:userId/role',
  authenticateToken,
  requireRole(['admin']),
  validateBody(schemas.updateUserRole),
  asyncHandler(async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      const result = await userService.updateUserRole(userId, role);
      sendSuccess(res, null, result.message);
    } catch (error) {
      if (error.message === 'User not found') {
        return sendError(res, error.message, 404);
      }
      sendError(res, 'Failed to update user role', 500);
    }
  })
);

/**
 * @route PUT /api/admin/users/:userId/status
 * @desc Update user status
 * @access Admin
 */
router.put('/users/:userId/status',
  authenticateToken,
  requireRole(['admin']),
  validateBody(schemas.updateUserStatus),
  asyncHandler(async (req, res) => {
    try {
      const { userId } = req.params;
      const { status } = req.body;
      
      const result = await userService.updateUserStatus(userId, status);
      sendSuccess(res, null, result.message);
    } catch (error) {
      if (error.message === 'User not found') {
        return sendError(res, error.message, 404);
      }
      sendError(res, 'Failed to update user status', 500);
    }
  })
);

/**
 * @route DELETE /api/admin/users/:userId
 * @desc Delete user
 * @access Admin
 */
router.delete('/users/:userId',
  authenticateToken,
  requireRole(['admin']),
  asyncHandler(async (req, res) => {
    try {
      const { userId } = req.params;
      const result = await userService.deleteUser(userId);
      sendSuccess(res, null, result.message);
    } catch (error) {
      if (error.message === 'User not found') {
        return sendError(res, error.message, 404);
      }
      sendError(res, 'Failed to delete user', 500);
    }
  })
);

module.exports = router;