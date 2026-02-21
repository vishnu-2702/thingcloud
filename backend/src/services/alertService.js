/**
 * Alert Service
 * Business logic for alert management
 */

const { dynamodb, TABLES } = require('../config/database');
const { GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { generateId, getCurrentTimestamp } = require('../utils/helpers');

class AlertService {
  constructor() {
    this.socketHandler = null;
  }

  /**
   * Set socket handler for real-time notifications
   */
  setSocketHandler(socketHandler) {
    this.socketHandler = socketHandler;
    console.log('[Alert Service] Socket handler initialized');
  }

  /**
   * Create a new alert
   */
  async createAlert(userId, alertData) {
    const {
      message,
      severity = 'info',
      type = 'system',
      deviceId = null,
      deviceName = null,
      description = null,
      metadata = {}
    } = alertData;

    const alertId = generateId();
    const timestamp = new Date().toISOString();
    const alert = {
      alertId, // DynamoDB partition key
      userId, // User who owns the alert
      message,
      severity, // critical, warning, info
      type, // device_offline, device_online, system, telemetry, error
      deviceId,
      deviceName,
      description,
      metadata,
      read: false,
      createdAt: timestamp,
      resolvedAt: null,
      status: 'active' // active, resolved
    };

    try {
      await dynamodb.send(new PutCommand({
        TableName: TABLES.ALERTS,
        Item: alert
      }));

      console.log(`[AlertService] ✅ Alert created: ${alert.message} (alertId: ${alert.alertId})`);
    } catch (dbError) {
      console.error('[AlertService] ❌ Database error creating alert:', dbError);
      throw dbError;
    }

    // Emit socket notification if handler is available (non-blocking)
    try {
      if (this.socketHandler) {
        console.log(`[AlertService] 📡 Emitting socket event for user ${userId}`);
        this.socketHandler.emitAlert(userId, alert);
      } else {
        console.warn('[AlertService] ⚠️ No socket handler - alerts will need polling');
      }
    } catch (socketError) {
      console.error('[AlertService] ❌ Socket emission error (non-critical):', socketError.message);
      // Don't throw - alert was saved successfully
    }

    return alert;
  }

  /**
   * Get all alerts for a user
   */
  async getUserAlerts(userId, options = {}) {
    const {
      limit = 50,
      severity = null,
      status = null,
      unreadOnly = false
    } = options;

    try {
      let filterExpressions = ['userId = :userId'];
      let expressionAttributeValues = {
        ':userId': userId
      };
      let expressionAttributeNames = {};

      // Build filter expression
      if (severity) {
        filterExpressions.push('severity = :severity');
        expressionAttributeValues[':severity'] = severity;
      }

      if (status) {
        filterExpressions.push('#status = :status');
        expressionAttributeValues[':status'] = status;
        expressionAttributeNames['#status'] = 'status';
      }

      if (unreadOnly) {
        filterExpressions.push('#read = :read');
        expressionAttributeValues[':read'] = false;
        expressionAttributeNames['#read'] = 'read';
      }

      // Try using GSI first (faster if index exists)
      try {
        const queryParams = {
          TableName: TABLES.ALERTS,
          IndexName: 'UserIdIndex',
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: expressionAttributeValues,
          ScanIndexForward: false, // Sort by timestamp descending
          Limit: limit
        };

        // Apply additional filters if any
        const additionalFilters = filterExpressions.slice(1); // Skip userId filter (it's in KeyCondition)
        if (additionalFilters.length > 0) {
          queryParams.FilterExpression = additionalFilters.join(' AND ');
          if (Object.keys(expressionAttributeNames).length > 0) {
            queryParams.ExpressionAttributeNames = expressionAttributeNames;
          }
        }

        const result = await dynamodb.send(new QueryCommand(queryParams));
        return result.Items || [];
      } catch (indexError) {
        console.warn('[AlertService] GSI query failed, falling back to Scan:', indexError.message);
        
        // Fallback to Scan with filter (slower but works without GSI)
        const scanParams = {
          TableName: TABLES.ALERTS,
          FilterExpression: filterExpressions.join(' AND '),
          ExpressionAttributeValues: expressionAttributeValues,
          Limit: limit
        };

        if (Object.keys(expressionAttributeNames).length > 0) {
          scanParams.ExpressionAttributeNames = expressionAttributeNames;
        }

        const result = await dynamodb.send(new ScanCommand(scanParams));
        const items = result.Items || [];
        
        // Sort by createdAt descending
        items.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
        
        return items.slice(0, limit);
      }
    } catch (error) {
      console.error('[AlertService] Error fetching user alerts:', error);
      // Return empty array instead of throwing to prevent API timeout
      return [];
    }
  }

  /**
   * Get alert by ID
   */
  async getAlertById(alertId) {
    const result = await dynamodb.send(new GetCommand({
      TableName: TABLES.ALERTS,
      Key: { alertId }
    }));

    return result.Item;
  }

  /**
   * Get alert with ownership check
   */
  async getAlertByIdForUser(alertId, userId) {
    const alert = await this.getAlertById(alertId);
    
    if (!alert) {
      throw new Error('Alert not found');
    }

    if (alert.userId !== userId) {
      throw new Error('Access denied: You do not own this alert');
    }

    return alert;
  }

  /**
   * Mark alert as read
   */
  async markAsRead(alertId, userId) {
    console.log(`[AlertService] 🔍 Marking alert as read:`, { alertId, userId });
    
    try {
      const alert = await this.getAlertByIdForUser(alertId, userId);
      console.log(`[AlertService] ✅ Alert found:`, { 
        alertId: alert.alertId, 
        userId: alert.userId,
        message: alert.message,
        currentReadStatus: alert.read 
      });

      await dynamodb.send(new UpdateCommand({
        TableName: TABLES.ALERTS,
        Key: { alertId },
        UpdateExpression: 'SET #read = :read',
        ExpressionAttributeNames: {
          '#read': 'read'
        },
        ExpressionAttributeValues: {
          ':read': true
        }
      }));

      console.log(`[AlertService] ✅ Alert marked as read successfully`);
      return { ...alert, read: true };
    } catch (error) {
      console.error(`[AlertService] ❌ Error marking alert as read:`, {
        alertId,
        userId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Mark all alerts as read for a user
   */
  async markAllAsRead(userId) {
    const alerts = await this.getUserAlerts(userId, { unreadOnly: true });
    
    const updatePromises = alerts.map(alert =>
      dynamodb.send(new UpdateCommand({
        TableName: TABLES.ALERTS,
        Key: { alertId: alert.alertId },
        UpdateExpression: 'SET #read = :read',
        ExpressionAttributeNames: {
          '#read': 'read'
        },
        ExpressionAttributeValues: {
          ':read': true
        }
      }))
    );

    await Promise.all(updatePromises);
    return { markedCount: alerts.length };
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId, userId) {
    const alert = await this.getAlertByIdForUser(alertId, userId);
    const timestamp = new Date().toISOString();

    await dynamodb.send(new UpdateCommand({
      TableName: TABLES.ALERTS,
      Key: { alertId },
      UpdateExpression: 'SET #status = :status, resolvedAt = :resolvedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'resolved',
        ':resolvedAt': timestamp
      }
    }));

    return { ...alert, status: 'resolved', resolvedAt: timestamp };
  }

  /**
   * Delete an alert
   */
  async deleteAlert(alertId, userId) {
    await this.getAlertByIdForUser(alertId, userId);

    await dynamodb.send(new DeleteCommand({
      TableName: TABLES.ALERTS,
      Key: { alertId }
    }));

    return { message: 'Alert deleted successfully' };
  }

  /**
   * Get unread alert count for user
   */
  async getUnreadCount(userId) {
    const alerts = await this.getUserAlerts(userId, { unreadOnly: true });
    return alerts.length;
  }

  /**
   * Create device offline alert
   */
  async createDeviceOfflineAlert(userId, deviceId, deviceName, inactiveDuration) {
    return await this.createAlert(userId, {
      message: `Device "${deviceName}" went offline`,
      severity: 'warning',
      type: 'device_offline',
      deviceId,
      deviceName,
      description: `Device has been inactive for ${inactiveDuration} minutes`,
      metadata: {
        inactiveDuration,
        autoGenerated: true
      }
    });
  }

  /**
   * Create device online alert
   */
  async createDeviceOnlineAlert(userId, deviceId, deviceName) {
    return await this.createAlert(userId, {
      message: `Device "${deviceName}" is back online`,
      severity: 'info',
      type: 'device_online',
      deviceId,
      deviceName,
      description: `Device has reconnected successfully`,
      metadata: {
        autoGenerated: true
      }
    });
  }

  /**
   * Create telemetry error alert
   */
  async createTelemetryErrorAlert(userId, deviceId, deviceName, errors) {
    return await this.createAlert(userId, {
      message: `Telemetry validation errors for "${deviceName}"`,
      severity: 'warning',
      type: 'telemetry',
      deviceId,
      deviceName,
      description: `Detected ${errors.length} validation error(s)`,
      metadata: {
        errors,
        autoGenerated: true
      }
    });
  }
}

module.exports = new AlertService();
