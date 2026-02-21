/**
 * Telemetry Routes
 * IoT device telemetry data endpoints
 */

const express = require('express');
const router = express.Router();

const telemetryService = require('../services/telemetryService');
const deviceService = require('../services/deviceService');
const { validateBody } = require('../middleware/validation');
const { authenticateDevice } = require('../middleware/auth');
const { sendSuccess, sendError, asyncHandler } = require('../utils/responses');
const schemas = require('../validators/schemas');

/**
 * @route POST /api/telemetry
 * @desc Receive telemetry data from IoT devices
 * @access Device (API Key)
 * @note CORS FULLY UNRESTRICTED - accepts requests from ANY IP/origin/network
 * @note NO rate limiting, NO IP restrictions for IoT device compatibility
 */
router.post('/',
  // CORS is handled by the global middleware in server.js which is configured to allow * for /api/telemetry
  authenticateDevice,
  validateBody(schemas.telemetry),
  asyncHandler(async (req, res) => {
    try {
      console.log('[Telemetry] Received data from device:', req.device.deviceId, req.device.name);
      
      const { data } = req.body;
      const result = await telemetryService.storeTelemetryData(req.device, data);
      
      console.log('[Telemetry] Data stored successfully, telemetryId:', result.telemetryId);
      
      // WebSocket disabled for telemetry ingestion to prevent timeouts/hangs
      // Real-time updates can be polled from frontend or triggered separately
      // Device status and lastSeen are always updated in telemetryService.storeTelemetryData()
      
      const response = {
        message: 'Telemetry data received',
        telemetryId: result.telemetryId
      };
      
      // Include validation info if there were issues
      if (!result.validated && result.errors.length > 0) {
        response.validation = {
          validated: false,
          errors: result.errors
        };
      }
      
      console.log('[Telemetry] Sending success response');
      sendSuccess(res, response, 'Telemetry data received', 201);
    } catch (error) {
      console.error('[Telemetry] ERROR:', error);
      console.error('[Telemetry] Stack:', error.stack);
      sendError(res, 'Failed to store telemetry data', 500);
    }
  })
);

module.exports = router;