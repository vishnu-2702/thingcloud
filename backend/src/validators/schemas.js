/**
 * Validation Schemas
 * Joi validation schemas for request data
 */

const Joi = require('joi');

const schemas = {
  // Authentication schemas
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required()
  }),

  // Device schemas
  device: Joi.object({
    name: Joi.string().required(),
    type: Joi.string().optional().default('generic'),
    description: Joi.string().optional().allow(''),
    templateId: Joi.string().optional().allow(null)
  }),

  deviceUpdate: Joi.object({
    name: Joi.string().optional(),
    description: Joi.string().optional().allow(''),
    location: Joi.string().optional().allow('')
  }),

  // Telemetry schemas
  telemetry: Joi.object({
    data: Joi.object().required()
  }),

  deviceCommand: Joi.object({
    command: Joi.string().required(),
    parameters: Joi.object().optional().default({})
  }),

  pinUpdate: Joi.object({
    value: Joi.alternatives().try(
      Joi.number(),
      Joi.string(),
      Joi.boolean(),
      Joi.allow(null)
    ).required()
  }),

  // Template schemas
  template: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional().allow(''),
    category: Joi.string().optional().default('general'),
    datastreams: Joi.array().items(
      Joi.object({
        virtualPin: Joi.string().required(),
        name: Joi.string().required(),
        dataType: Joi.string().valid('number', 'string', 'boolean').required(),
        unit: Joi.string().optional().allow(''),
        min: Joi.number().optional(),
        max: Joi.number().optional()
      })
    ).optional().default([])
  }),

  // User profile schemas
  userProfile: Joi.object({
    displayName: Joi.string().optional().allow(''),
    preferences: Joi.object({
      theme: Joi.string().valid('light', 'dark', 'auto').optional(),
      notifications: Joi.boolean().optional(),
      dashboardLayout: Joi.string().valid('grid', 'list', 'compact').optional()
    }).optional()
  }),

  // Admin schemas
  inviteUser: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().required(),
    role: Joi.string().valid('user', 'manager', 'admin').default('user')
  }),

  updateUserRole: Joi.object({
    role: Joi.string().valid('user', 'manager', 'admin').required()
  }),

  updateUserStatus: Joi.object({
    status: Joi.string().valid('active', 'suspended').required()
  }),

  // Sub-user schemas
  createSubUser: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).required(),
    deviceIds: Joi.array().items(Joi.string()).optional().default([]),
    devicePermissions: Joi.alternatives().try(
      // Per-device permissions format: { deviceId: { canView: true, ... } }
      Joi.object().pattern(
        Joi.string(),
        Joi.object({
          canView: Joi.boolean().optional().default(true),
          canControl: Joi.boolean().optional().default(false),
          canViewTelemetry: Joi.boolean().optional().default(true),
          canViewAlerts: Joi.boolean().optional().default(true),
          canModifyAlertRules: Joi.boolean().optional().default(false)
        })
      ),
      // Legacy format: single permissions object
      Joi.object({
        canView: Joi.boolean().optional().default(true),
        canControl: Joi.boolean().optional().default(false),
        canViewTelemetry: Joi.boolean().optional().default(true),
        canViewAlerts: Joi.boolean().optional().default(true),
        canModifyAlertRules: Joi.boolean().optional().default(false)
      })
    ).optional()
  }),

  // Alert schemas
  alert: Joi.object({
    name: Joi.string().required(),
    deviceId: Joi.string().required(),
    condition: Joi.object({
      pin: Joi.string().required(),
      operator: Joi.string().valid('>', '<', '>=', '<=', '==', '!=').required(),
      value: Joi.alternatives().try(Joi.number(), Joi.string()).required()
    }).required(),
    enabled: Joi.boolean().default(true)
  }),

  // Query parameter schemas
  telemetryQuery: Joi.object({
    limit: Joi.number().min(1).max(1000).default(100),
    startTime: Joi.number().optional(),
    endTime: Joi.number().optional()
  }),

  paginationQuery: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20)
  })
};

module.exports = schemas;