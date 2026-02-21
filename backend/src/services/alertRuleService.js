/**
 * Alert Rule Service
 * Manages device-specific alert rules and evaluates conditions
 */

const { dynamodb, TABLES } = require('../config/database');
const { GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { generateId, getCurrentTimestamp } = require('../utils/helpers');
const alertService = require('./alertService');

class AlertRuleService {
  /**
   * Create a new alert rule for a device
   */
  async createAlertRule(userId, ruleData) {
    const {
      deviceId,
      deviceName,
      datastreamPin,
      datastreamName,
      dataType,
      condition,
      threshold,
      severity = 'warning',
      message,
      enabled = true
    } = ruleData;

    // Validate condition based on data type
    this.validateCondition(dataType, condition, threshold);

    const ruleId = generateId();
    const rule = {
      ruleId,
      userId,
      deviceId,
      deviceName,
      datastreamPin,
      datastreamName,
      dataType, // number, boolean, string
      condition, // above, below, equals, notEquals, between (for numbers), equals/notEquals (for boolean/string)
      threshold, // single value or array [min, max] for 'between'
      severity, // info, warning, critical
      message,
      enabled,
      triggeredCount: 0,
      lastTriggered: null,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };

    await dynamodb.send(new PutCommand({
      TableName: TABLES.ALERT_RULES || 'iot-platform-alert-rules',
      Item: rule
    }));

    return rule;
  }

  /**
   * Validate condition based on data type
   */
  validateCondition(dataType, condition, threshold) {
    const validConditions = {
      number: ['above', 'below', 'equals', 'between'],
      boolean: ['equals', 'notEquals'],
      string: ['equals', 'notEquals', 'contains']
    };

    if (!validConditions[dataType]) {
      throw new Error(`Invalid data type: ${dataType}`);
    }

    if (!validConditions[dataType].includes(condition)) {
      throw new Error(`Invalid condition '${condition}' for data type '${dataType}'. Valid conditions: ${validConditions[dataType].join(', ')}`);
    }

    // Validate threshold type
    if (dataType === 'number') {
      if (condition === 'between') {
        if (!Array.isArray(threshold) || threshold.length !== 2) {
          throw new Error('Threshold for "between" condition must be an array of two numbers [min, max]');
        }
        if (typeof threshold[0] !== 'number' || typeof threshold[1] !== 'number') {
          throw new Error('Threshold values must be numbers');
        }
        if (threshold[0] >= threshold[1]) {
          throw new Error('Min threshold must be less than max threshold');
        }
      } else {
        if (typeof threshold !== 'number') {
          throw new Error('Threshold must be a number for numeric conditions');
        }
      }
    } else if (dataType === 'boolean') {
      if (typeof threshold !== 'boolean') {
        throw new Error('Threshold must be a boolean (true/false)');
      }
    } else if (dataType === 'string') {
      if (typeof threshold !== 'string') {
        throw new Error('Threshold must be a string');
      }
    }

    return true;
  }

  /**
   * Get all alert rules for a user
   */
  async getUserAlertRules(userId, deviceId = null) {
    const params = {
      TableName: TABLES.ALERT_RULES,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };

    // Filter by deviceId if provided
    if (deviceId) {
      params.FilterExpression = 'deviceId = :deviceId';
      params.ExpressionAttributeValues[':deviceId'] = deviceId;
    }

    const result = await dynamodb.send(new QueryCommand(params));
    return result.Items || [];
  }

  /**
   * Get alert rule by ID
   */
  async getAlertRuleById(ruleId) {
    const result = await dynamodb.send(new GetCommand({
      TableName: TABLES.ALERT_RULES,
      Key: { ruleId }
    }));

    return result.Item;
  }

  /**
   * Update alert rule
   */
  async updateAlertRule(ruleId, userId, updateData) {
    const rule = await this.getAlertRuleById(ruleId);
    
    if (!rule) {
      throw new Error('Alert rule not found');
    }

    if (rule.userId !== userId) {
      throw new Error('Access denied');
    }

    const {
      condition,
      threshold,
      severity,
      message,
      enabled
    } = updateData;

    // Validate if condition or threshold is being updated
    if (condition || threshold) {
      this.validateCondition(
        rule.dataType,
        condition || rule.condition,
        threshold !== undefined ? threshold : rule.threshold
      );
    }

    const updateExpression = [];
    const expressionAttributeValues = {
      ':updatedAt': getCurrentTimestamp()
    };
    const expressionAttributeNames = {};

    if (condition !== undefined) {
      updateExpression.push('#condition = :condition');
      expressionAttributeValues[':condition'] = condition;
      expressionAttributeNames['#condition'] = 'condition';
    }
    if (threshold !== undefined) {
      updateExpression.push('threshold = :threshold');
      expressionAttributeValues[':threshold'] = threshold;
    }
    if (severity !== undefined) {
      updateExpression.push('severity = :severity');
      expressionAttributeValues[':severity'] = severity;
    }
    if (message !== undefined) {
      updateExpression.push('message = :message');
      expressionAttributeValues[':message'] = message;
    }
    if (enabled !== undefined) {
      updateExpression.push('enabled = :enabled');
      expressionAttributeValues[':enabled'] = enabled;
    }

    updateExpression.push('updatedAt = :updatedAt');

    const updateParams = {
      TableName: TABLES.ALERT_RULES || 'iot-platform-alert-rules',
      Key: { ruleId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    // Only add ExpressionAttributeNames if we have any
    if (Object.keys(expressionAttributeNames).length > 0) {
      updateParams.ExpressionAttributeNames = expressionAttributeNames;
    }

    const result = await dynamodb.send(new UpdateCommand(updateParams));

    return result.Attributes;
  }

  /**
   * Delete alert rule
   */
  async deleteAlertRule(ruleId, userId) {
    const rule = await this.getAlertRuleById(ruleId);
    
    if (!rule) {
      throw new Error('Alert rule not found');
    }

    if (rule.userId !== userId) {
      throw new Error('Access denied');
    }

    await dynamodb.send(new DeleteCommand({
      TableName: TABLES.ALERT_RULES || 'iot-platform-alert-rules',
      Key: { ruleId }
    }));

    return { message: 'Alert rule deleted successfully' };
  }

  /**
   * Evaluate telemetry data against alert rules
   * Returns array of triggered alerts
   */
  async evaluateTelemetryData(deviceId, userId, telemetryData) {
    try {
      // Get all enabled rules for this device
      const rules = await this.getUserAlertRules(userId, deviceId);
      const enabledRules = rules.filter(rule => rule.enabled);

      console.log(`[AlertRule] Evaluating ${enabledRules.length} enabled rule(s) for device ${deviceId}`);
      console.log(`[AlertRule] Telemetry data keys: ${Object.keys(telemetryData).join(', ')}`);

      if (enabledRules.length === 0) {
        console.log(`[AlertRule] No enabled rules found for device ${deviceId}`);
        return [];
      }

      const triggeredAlerts = [];

      for (const rule of enabledRules) {
        try {
          const { datastreamPin, condition, threshold, dataType } = rule;
          
          // Check if this datastream is in the telemetry data
          if (!(datastreamPin in telemetryData)) {
            console.log(`[AlertRule] ⏭️  Skipping rule ${rule.ruleId}: datastream ${datastreamPin} not in telemetry`);
            continue;
          }

          const value = telemetryData[datastreamPin];
          
          console.log(`[AlertRule] 🔍 Checking rule ${rule.ruleId}:`);
          console.log(`   Datastream: ${datastreamPin} = ${value} (type: ${typeof value})`);
          console.log(`   Condition: ${condition} ${JSON.stringify(threshold)} (expected type: ${dataType})`);
          
          // Evaluate condition
          const isTriggered = this.evaluateCondition(value, condition, threshold, dataType);

          console.log(`[AlertRule] Result: ${isTriggered ? '✅ TRIGGERED' : '❌ Not triggered'}`);

          if (isTriggered) {
            // Create alert
            const alert = await this.triggerAlert(rule, value);
            triggeredAlerts.push(alert);

            // Update rule triggered stats
            await this.updateRuleTriggeredStats(rule.ruleId);
            
            console.log(`[AlertRule] 🚨 Alert created: "${alert.message}" (severity: ${alert.severity})`);
          }
        } catch (ruleError) {
          console.error(`[AlertRule] ❌ Error processing rule ${rule.ruleId}:`, ruleError.message);
          // Continue with other rules even if one fails
        }
      }

      console.log(`[AlertRule] 📊 Summary: ${triggeredAlerts.length}/${enabledRules.length} rules triggered`);
      return triggeredAlerts;
    } catch (error) {
      console.error('[AlertRule] ❌ Fatal error in evaluateTelemetryData:', error);
      throw error;
    }
  }

  /**
   * Evaluate a single condition
   */
  evaluateCondition(value, condition, threshold, dataType) {
    try {
      switch (dataType) {
        case 'number': {
          const numValue = Number(value);
          const numThreshold = Number(threshold);
          
          if (isNaN(numValue)) {
            console.log(`[AlertRule] Value is not a number: ${value}`);
            return false;
          }

          switch (condition) {
            case 'above':
              return numValue > numThreshold;
            case 'below':
              return numValue < numThreshold;
            case 'equals':
              // Use small tolerance for floating point comparison
              const tolerance = 0.0001;
              return Math.abs(numValue - numThreshold) < tolerance;
            case 'between':
              if (!Array.isArray(threshold) || threshold.length !== 2) {
                console.error('[AlertRule] Between condition requires array with 2 values');
                return false;
              }
              const min = Number(threshold[0]);
              const max = Number(threshold[1]);
              return numValue >= min && numValue <= max;
            default:
              return false;
          }
        }

        case 'boolean': {
          // Handle various boolean representations
          let boolValue;
          if (typeof value === 'boolean') {
            boolValue = value;
          } else if (typeof value === 'string') {
            boolValue = value.toLowerCase() === 'true';
          } else if (typeof value === 'number') {
            boolValue = value !== 0;
          } else {
            boolValue = Boolean(value);
          }
          
          const boolThreshold = Boolean(threshold);
          
          switch (condition) {
            case 'equals':
              return boolValue === boolThreshold;
            case 'notEquals':
              return boolValue !== boolThreshold;
            default:
              return false;
          }
        }

        case 'string': {
          const strValue = String(value);
          const strThreshold = String(threshold);
          
          switch (condition) {
            case 'equals':
              return strValue === strThreshold;
            case 'notEquals':
              return strValue !== strThreshold;
            case 'contains':
              return strValue.toLowerCase().includes(strThreshold.toLowerCase());
            default:
              return false;
          }
        }

        default:
          return false;
      }
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  /**
   * Trigger an alert based on rule
   */
  async triggerAlert(rule, currentValue) {
    const alertMessage = rule.message || this.generateAlertMessage(rule, currentValue);

    const alert = await alertService.createAlert(rule.userId, {
      message: alertMessage,
      severity: rule.severity,
      type: 'threshold',
      deviceId: rule.deviceId,
      deviceName: rule.deviceName,
      description: `Alert rule triggered: ${rule.datastreamName} (${rule.datastreamPin})`,
      metadata: {
        ruleId: rule.ruleId,
        datastreamPin: rule.datastreamPin,
        datastreamName: rule.datastreamName,
        condition: rule.condition,
        threshold: rule.threshold,
        currentValue: currentValue,
        dataType: rule.dataType,
        autoGenerated: true
      }
    });

    return alert;
  }

  /**
   * Generate alert message
   */
  generateAlertMessage(rule, currentValue) {
    const { deviceName, datastreamName, condition, threshold, dataType } = rule;

    let conditionText = '';
    if (dataType === 'number') {
      if (condition === 'above') {
        conditionText = `exceeded ${threshold}`;
      } else if (condition === 'below') {
        conditionText = `dropped below ${threshold}`;
      } else if (condition === 'equals') {
        conditionText = `equals ${threshold}`;
      } else if (condition === 'between') {
        conditionText = `is between ${threshold[0]} and ${threshold[1]}`;
      }
    } else if (dataType === 'boolean') {
      conditionText = condition === 'equals' 
        ? `is ${threshold ? 'true' : 'false'}` 
        : `is not ${threshold ? 'true' : 'false'}`;
    } else if (dataType === 'string') {
      if (condition === 'equals') {
        conditionText = `equals "${threshold}"`;
      } else if (condition === 'notEquals') {
        conditionText = `does not equal "${threshold}"`;
      } else if (condition === 'contains') {
        conditionText = `contains "${threshold}"`;
      }
    }

    return `${deviceName}: ${datastreamName} ${conditionText} (current: ${currentValue})`;
  }

  /**
   * Update rule triggered statistics
   */
  async updateRuleTriggeredStats(ruleId) {
    await dynamodb.send(new UpdateCommand({
      TableName: TABLES.ALERT_RULES || 'iot-platform-alert-rules',
      Key: { ruleId },
      UpdateExpression: 'SET triggeredCount = if_not_exists(triggeredCount, :zero) + :inc, lastTriggered = :now',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':zero': 0,
        ':now': getCurrentTimestamp()
      }
    }));
  }

  /**
   * Get alert rules for a specific datastream
   */
  async getDatastreamRules(deviceId, userId, datastreamPin) {
    const rules = await this.getUserAlertRules(userId, deviceId);
    return rules.filter(rule => rule.datastreamPin === datastreamPin);
  }

  /**
   * Toggle rule enabled status
   */
  async toggleRule(ruleId, userId) {
    const rule = await this.getAlertRuleById(ruleId);
    
    if (!rule) {
      throw new Error('Alert rule not found');
    }

    if (rule.userId !== userId) {
      throw new Error('Access denied');
    }

    const result = await dynamodb.send(new UpdateCommand({
      TableName: TABLES.ALERT_RULES || 'iot-platform-alert-rules',
      Key: { ruleId },
      UpdateExpression: 'SET enabled = :enabled, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':enabled': !rule.enabled,
        ':updatedAt': getCurrentTimestamp()
      },
      ReturnValues: 'ALL_NEW'
    }));

    return result.Attributes;
  }

  /**
   * Get rules summary for a device
   */
  async getDeviceRulesSummary(deviceId, userId) {
    const rules = await this.getUserAlertRules(userId, deviceId);
    
    return {
      total: rules.length,
      enabled: rules.filter(r => r.enabled).length,
      disabled: rules.filter(r => !r.enabled).length,
      bySeverity: {
        info: rules.filter(r => r.severity === 'info').length,
        warning: rules.filter(r => r.severity === 'warning').length,
        critical: rules.filter(r => r.severity === 'critical').length
      },
      rules: rules
    };
  }
}

module.exports = new AlertRuleService();
