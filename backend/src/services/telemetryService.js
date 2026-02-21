/**
 * Telemetry Service
 * Business logic for telemetry data management
 */

const { dynamodb, TABLES } = require('../config/database');
const { PutCommand, UpdateCommand, QueryCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { validateTelemetryData, generateId, getCurrentTimestamp } = require('../utils/helpers');
const deviceService = require('./deviceService');
const templateService = require('./templateService');
const alertService = require('./alertService');
const alertRuleService = require('./alertRuleService');

class TelemetryService {
  /**
   * Store telemetry data
   */
  async storeTelemetryData(device, data) {
    const timestamp = getCurrentTimestamp();
    const telemetryId = generateId();

    // Check if device was offline before (to create "back online" alert)
    const wasOffline = device.status === 'offline';

    // Get device template for validation if exists
    let template = null;
    let validationResult = { isValid: true, errors: [] };
    
    if (device.templateId) {
      try {
        template = await templateService.getTemplateById(device.templateId);
        if (template) {
          validationResult = validateTelemetryData(data, template);
        }
      } catch (error) {
        console.warn('Template validation failed:', error.message);
      }
    }

    // Store telemetry data
    const telemetryData = {
      telemetryId,
      deviceId: device.deviceId,
      data,
      timestamp,
      templateId: device.templateId || null,
      validated: validationResult.isValid,
      validationErrors: validationResult.errors
    };

    await dynamodb.send(new PutCommand({
      TableName: TABLES.TELEMETRY,
      Item: telemetryData
    }));

    // Update device last seen status
    await deviceService.updateDeviceStatus(device.deviceId, 'online', timestamp);

    // Create alert if device came back online
    if (wasOffline) {
      try {
        await alertService.createDeviceOnlineAlert(
          device.userId,
          device.deviceId,
          device.name
        );
        console.log(`[Alert] Device ${device.name} is back online`);
      } catch (alertError) {
        console.error('[Alert] Error creating online alert:', alertError);
      }
    }

    // Create alert for validation errors
    if (!validationResult.isValid && validationResult.errors.length > 0) {
      try {
        await alertService.createTelemetryErrorAlert(
          device.userId,
          device.deviceId,
          device.name,
          validationResult.errors
        );
        console.log(`[Alert] Telemetry validation errors for device ${device.name}`);
      } catch (alertError) {
        console.error('[Alert] Error creating validation alert:', alertError);
      }
    }

    // Evaluate alert rules for this telemetry data
    // In serverless environments, we must await this to ensure execution before process freeze
    try {
      console.log(`[Alert] Starting evaluation for device ${device.name} (${device.deviceId})`);
      const triggeredAlerts = await alertRuleService.evaluateTelemetryData(
        device.deviceId,
        device.userId,
        data
      );
      
      if (triggeredAlerts.length > 0) {
        console.log(`[Alert] ✅ Triggered ${triggeredAlerts.length} alert rule(s) for device ${device.name}`);
        triggeredAlerts.forEach((alert, index) => {
          console.log(`  ${index + 1}. ${alert.severity}: ${alert.message}`);
        });
      } else {
        console.log(`[Alert] No rules triggered for device ${device.name}`);
      }
    } catch (alertRuleError) {
      console.error('[Alert] ❌ Error evaluating alert rules:', alertRuleError);
      console.error('[Alert] Stack:', alertRuleError.stack);
    }

    return {
      telemetryId,
      timestamp,
      validated: validationResult.isValid,
      errors: validationResult.errors
    };
  }

  /**
   * Get device telemetry data
   */
  async getDeviceTelemetry(deviceId, options = {}) {
    const { limit = 100, startTime, endTime } = options;

    console.log('TelemetryService: Getting telemetry for device:', deviceId, 'options:', options);

    let params = {
      TableName: TABLES.TELEMETRY,
      IndexName: 'DeviceIdIndex', // FIXED: Corrected GSI name (was DeviceIdTimestampIndex)
      KeyConditionExpression: 'deviceId = :deviceId',
      ExpressionAttributeValues: {
        ':deviceId': deviceId
      },
      ScanIndexForward: false, // Sort by timestamp descending
      Limit: parseInt(limit)
    };

    // Add time range filter if provided
    if (startTime && endTime) {
      // Convert timestamp to ISO string if it's a number (from frontend)
      const startTimeStr = typeof startTime === 'number' ? new Date(startTime).toISOString() : startTime;
      const endTimeStr = typeof endTime === 'number' ? new Date(endTime).toISOString() : endTime;
      
      params.KeyConditionExpression += ' AND #timestamp BETWEEN :startTime AND :endTime';
      params.ExpressionAttributeNames = { '#timestamp': 'timestamp' };
      params.ExpressionAttributeValues[':startTime'] = startTimeStr;
      params.ExpressionAttributeValues[':endTime'] = endTimeStr;
      console.log('TelemetryService: Using time range filter:', startTimeStr, 'to', endTimeStr);
    }

    try {
      const result = await dynamodb.send(new QueryCommand(params));
      console.log('TelemetryService: Query result count:', result.Items?.length || 0);
      return result.Items || [];
    } catch (error) {
      console.error('TelemetryService: Error querying telemetry:', error);
      // Return empty array instead of throwing to prevent breaking the app
      return [];
    }
  }

  /**
   * Get latest telemetry data for device
   */
  async getLatestTelemetry(deviceId) {
    const result = await this.getDeviceTelemetry(deviceId, { limit: 1 });
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Store device command/control data
   */
  async storeDeviceCommand(deviceId, userId, commandData) {
    const timestamp = getCurrentTimestamp();
    const telemetryId = generateId();

    const { command, parameters, pin, value } = commandData;

    // Create command telemetry entry
    const commandTelemetryData = {
      telemetryId,
      deviceId: deviceId,
      data: pin ? { [pin]: value } : { command, parameters: parameters || {} },
      timestamp,
      type: 'command',
      source: 'dashboard',
      userId
    };

    await dynamodb.send(new PutCommand({
      TableName: TABLES.TELEMETRY,
      Item: commandTelemetryData
    }));

    return {
      commandId: telemetryId,
      timestamp,
      ...(pin && { pin, value }),
      ...(command && { command, parameters })
    };
  }

  /**
   * Get device pin states
   */
  async getDevicePinStates(deviceId, templateId = null) {
    // Get latest telemetry data
    const latestData = await this.getLatestTelemetry(deviceId);
    const currentData = latestData ? latestData.data : {};

    let pinDefinitions = [];

    // Get pin definitions from template if available
    if (templateId) {
      try {
        const template = await templateService.getTemplateById(templateId);
        if (template && template.datastreams) {
          pinDefinitions = template.datastreams.map(stream => ({
            pin: stream.virtualPin || stream.pin,
            name: stream.name,
            type: stream.type || stream.dataType,
            unit: stream.unit,
            min: stream.min,
            max: stream.max,
            currentValue: currentData[stream.virtualPin || stream.pin] || null,
            lastUpdated: latestData ? latestData.timestamp : null
          }));
        }
      } catch (error) {
        console.warn('Template not found for pin definitions:', error);
      }
    }

    // If no template, create pin definitions from latest data
    if (pinDefinitions.length === 0 && Object.keys(currentData).length > 0) {
      pinDefinitions = Object.entries(currentData).map(([pin, value]) => ({
        pin,
        name: pin,
        type: typeof value === 'number' ? 'number' : 'string',
        currentValue: value,
        lastUpdated: latestData ? latestData.timestamp : null
      }));
    }

    return {
      deviceId,
      pins: pinDefinitions,
      lastDataUpdate: latestData ? latestData.timestamp : null
    };
  }

  /**
   * Store test telemetry data
   */
  async storeTestData(device) {
    const sampleData = deviceService.generateSampleData();
    return await this.storeTelemetryData(device, sampleData);
  }
}

module.exports = new TelemetryService();