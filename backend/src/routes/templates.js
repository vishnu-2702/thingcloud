/**
 * Template Routes
 * Device template management endpoints
 */

const express = require('express');
const router = express.Router();

const templateService = require('../services/templateService');
const { validateBody } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { sendSuccess, sendError, asyncHandler } = require('../utils/responses');
const schemas = require('../validators/schemas');

/**
 * @route GET /api/templates
 * @desc Get all templates (user's + public)
 * @access Private
 */
router.get('/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const templates = await templateService.getAllTemplates(req.user.userId);
      sendSuccess(res, { templates, count: templates.length });
    } catch (error) {
      sendError(res, 'Failed to fetch templates', 500);
    }
  })
);

/**
 * @route GET /api/templates/user/my-templates
 * @desc Get user's own templates
 * @access Private
 */
router.get('/user/my-templates',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const templates = await templateService.getUserTemplates(req.user.userId);
      sendSuccess(res, { templates, count: templates.length });
    } catch (error) {
      sendError(res, 'Failed to fetch user templates', 500);
    }
  })
);

/**
 * @route GET /api/templates/categories/list
 * @desc Get template categories
 * @access Private
 */
router.get('/categories/list',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const categories = templateService.getCategories();
      sendSuccess(res, { categories });
    } catch (error) {
      sendError(res, 'Failed to fetch categories', 500);
    }
  })
);

/**
 * @route GET /api/templates/:templateId
 * @desc Get template by ID
 * @access Private
 */
router.get('/:templateId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const template = await templateService.getTemplateByIdForUser(
        req.params.templateId,
        req.user.userId
      );
      sendSuccess(res, { template });
    } catch (error) {
      if (error.message === 'Template not found') {
        return sendError(res, error.message, 404);
      }
      if (error.message === 'Access denied') {
        return sendError(res, error.message, 403);
      }
      sendError(res, 'Failed to fetch template', 500);
    }
  })
);

/**
 * @route POST /api/templates
 * @desc Create a new template
 * @access Private
 */
router.post('/',
  authenticateToken,
  validateBody(schemas.template),
  asyncHandler(async (req, res) => {
    try {
      const template = await templateService.createTemplate(req.user.userId, req.body);
      sendSuccess(res, { template }, 'Template created successfully', 201);
    } catch (error) {
      sendError(res, 'Failed to create template', 500);
    }
  })
);

/**
 * @route PUT /api/templates/:templateId
 * @desc Update template
 * @access Private
 */
router.put('/:templateId',
  authenticateToken,
  validateBody(schemas.template),
  asyncHandler(async (req, res) => {
    try {
      const template = await templateService.updateTemplate(
        req.params.templateId,
        req.user.userId,
        req.body
      );
      sendSuccess(res, { template }, 'Template updated successfully');
    } catch (error) {
      if (error.message === 'Template not found') {
        return sendError(res, error.message, 404);
      }
      if (error.message === 'Access denied' || error.message === 'Cannot update public templates') {
        return sendError(res, error.message, 403);
      }
      sendError(res, 'Failed to update template', 500);
    }
  })
);

/**
 * @route DELETE /api/templates/:templateId
 * @desc Delete template
 * @access Private
 */
router.delete('/:templateId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const result = await templateService.deleteTemplate(
        req.params.templateId,
        req.user.userId
      );
      sendSuccess(res, null, result.message);
    } catch (error) {
      if (error.message === 'Template not found') {
        return sendError(res, error.message, 404);
      }
      if (error.message === 'Access denied' || error.message === 'Cannot delete public templates') {
        return sendError(res, error.message, 403);
      }
      sendError(res, 'Failed to delete template', 500);
    }
  })
);

/**
 * @route POST /api/templates/:templateId/clone
 * @desc Clone template
 * @access Private
 */
router.post('/:templateId/clone',
  authenticateToken,
  asyncHandler(async (req, res) => {
    try {
      const { name } = req.body;
      const template = await templateService.cloneTemplate(
        req.params.templateId,
        req.user.userId,
        name
      );
      sendSuccess(res, { template }, 'Template cloned successfully', 201);
    } catch (error) {
      if (error.message === 'Template not found') {
        return sendError(res, error.message, 404);
      }
      sendError(res, 'Failed to clone template', 500);
    }
  })
);

module.exports = router;