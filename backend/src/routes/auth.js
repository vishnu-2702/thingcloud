/**
 * Authentication Routes
 * User authentication and authorization endpoints
 */

const express = require('express');
const router = express.Router();

const userService = require('../services/userService');
const { validateBody } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { sendSuccess, sendError, asyncHandler } = require('../utils/responses');
const schemas = require('../validators/schemas');

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', 
  validateBody(schemas.register),
  asyncHandler(async (req, res) => {
    try {
      const result = await userService.register(req.body);
      sendSuccess(res, result, 'User registered successfully', 201);
    } catch (error) {
      if (error.message === 'User already exists') {
        return sendError(res, error.message, 409);
      }
      sendError(res, 'Registration failed', 500);
    }
  })
);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login',
  validateBody(schemas.login),
  asyncHandler(async (req, res) => {
    try {
      const result = await userService.login(req.body.email, req.body.password);
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      if (error.message === 'Invalid credentials') {
        return sendError(res, error.message, 401);
      }
      sendError(res, 'Login failed', 500);
    }
  })
);

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.user.userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    // Remove password before sending response
    const { password, ...userWithoutPassword } = user;
    sendSuccess(res, { user: userWithoutPassword });
  })
);

/**
 * @route POST /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post('/change-password',
  authenticateToken,
  validateBody(schemas.changePassword),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await userService.changePassword(req.user.userId, currentPassword, newPassword);
    sendSuccess(res, null, result.message);
  })
);

module.exports = router;