/**
 * Device Service
 * Business logic for device management
 */

const { dynamodb, TABLES } = require('../config/database');
const { GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { generateApiKey } = require('../utils/auth');
const { formatDeviceData, generateId, getCurrentTimestamp } = require('../utils/helpers');

class DeviceService {
  /**
   * Create a new device
   */
  async createDevice(userId, deviceData) {
    const { name, type, description, templateId } = deviceData;
    const deviceId = generateId();
    const apiKey = generateApiKey();

    const device = {
      deviceId,
      userId,
      name,
      type: type || 'generic',
      description: description || '',
      templateId: templateId || null,
      apiKey,
      status: 'offline',
      lastSeen: null,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };

    await dynamodb.send(new PutCommand({
      TableName: TABLES.DEVICES,
      Item: device
    }));

    return formatDeviceData(device);
  }

  /**
   * Get user's devices
   * For admins: returns their own devices
   * For sub-users: returns only devices they have permission to access
   */
  async getUserDevices(userId, userRole = null) {
    // If user is a sub-user, get their accessible devices through permissions
    if (userRole === 'sub-user') {
      const devicePermissionService = require('./devicePermissionService');
      const permissions = await devicePermissionService.getUserAccessibleDevices(userId);
      
      if (permissions.length === 0) {
        return [];
      }
      
      // Fetch actual device details for each permission
      const devices = [];
      for (const perm of permissions) {
        try {
          const device = await this.getDeviceById(perm.deviceId);
          if (device) {
            devices.push({
              ...formatDeviceData(device),
              permissions: perm.permissions // Include permission details
            });
          }
        } catch (error) {
          console.error(`Error fetching device ${perm.deviceId}:`, error);
        }
      }
      return devices;
    }
    
    // For admins and regular users: return their own devices
    const result = await dynamodb.send(new QueryCommand({
      TableName: TABLES.DEVICES,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));

    return (result.Items || []).map(formatDeviceData);
  }

  /**
   * Get device by ID
   */
  async getDeviceById(deviceId) {
    const result = await dynamodb.send(new GetCommand({
      TableName: TABLES.DEVICES,
      Key: { deviceId }
    }));

    return result.Item;
  }

  /**
   * Get device with ownership check
   * For admins: checks if they own the device
   * For sub-users: checks if they have permission to access it
   */
  async getDeviceByIdForUser(deviceId, userId, userRole = null) {
    const device = await this.getDeviceById(deviceId);
    
    if (!device) {
      throw new Error('Device not found');
    }

    // Check if user is sub-user
    if (userRole === 'sub-user') {
      const devicePermissionService = require('./devicePermissionService');
      const hasAccess = await devicePermissionService.hasDeviceAccess(userId, deviceId);
      
      if (!hasAccess) {
        throw new Error('Access denied');
      }
      
      // Return device with permission details
      const permission = await devicePermissionService.getDevicePermission(userId, deviceId);
      return {
        ...device,
        permissions: permission.permissions
      };
    }

    // For admins and regular users: check ownership
    if (device.userId !== userId) {
      throw new Error('Access denied');
    }

    return device;
  }

  /**
   * Update device
   */
  async updateDevice(deviceId, userId, updateData) {
    const device = await this.getDeviceByIdForUser(deviceId, userId);

    const { name, description, location } = updateData;

    const updateParams = {
      TableName: TABLES.DEVICES,
      Key: { deviceId },
      UpdateExpression: 'SET #name = :name, description = :description, #location = :location, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#location': 'location'
      },
      ExpressionAttributeValues: {
        ':name': name || device.name,
        ':description': description !== undefined ? description : (device.description || ''),
        ':location': location !== undefined ? location : (device.location || ''),
        ':updatedAt': getCurrentTimestamp()
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamodb.send(new UpdateCommand(updateParams));
    return formatDeviceData(result.Attributes);
  }

  /**
   * Regenerate device API key
   */
  async regenerateApiKey(deviceId, userId) {
    // Verify ownership
    const device = await this.getDeviceByIdForUser(deviceId, userId);
    
    // Generate new API key
    const newApiKey = generateApiKey();
    
    const updateParams = {
      TableName: TABLES.DEVICES,
      Key: { deviceId },
      UpdateExpression: 'SET apiKey = :apiKey, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':apiKey': newApiKey,
        ':updatedAt': getCurrentTimestamp()
      },
      ReturnValues: 'ALL_NEW'
    };

    await dynamodb.send(new UpdateCommand(updateParams));
    console.log(`[Device] Regenerated API key for device ${deviceId}`);
    
    return { apiKey: newApiKey };
  }

  /**
   * Delete device
   */
  async deleteDevice(deviceId, userId) {
    await this.getDeviceByIdForUser(deviceId, userId);

    await dynamodb.send(new DeleteCommand({
      TableName: TABLES.DEVICES,
      Key: { deviceId }
    }));

    return { message: 'Device deleted successfully' };
  }

  /**
   * Update device status (atomic operation)
   * Note: DynamoDB ensures atomicity per-item by default
   */
  async updateDeviceStatus(deviceId, status, lastSeen = null) {
    const updateParams = {
      TableName: TABLES.DEVICES,
      Key: { deviceId },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status
      }
    };

    // Update lastSeen atomically with status
    if (lastSeen !== null) {
      updateParams.UpdateExpression += ', lastSeen = :lastSeen';
      updateParams.ExpressionAttributeValues[':lastSeen'] = lastSeen;
    }

    try {
      await dynamodb.send(new UpdateCommand(updateParams));
    } catch (error) {
      console.error(`Failed to update device status for ${deviceId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get device by API key
   */
  async getDeviceByApiKey(apiKey) {
    const result = await dynamodb.send(new QueryCommand({
      TableName: TABLES.DEVICES,
      IndexName: 'ApiKeyIndex',
      KeyConditionExpression: 'apiKey = :apiKey',
      ExpressionAttributeValues: {
        ':apiKey': apiKey
      }
    }));

    return result.Items && result.Items.length > 0 ? result.Items[0] : null;
  }

  /**
   * Generate sample telemetry data for testing
   */
  generateSampleData() {
    return {
      "1": Math.round((20 + Math.random() * 10) * 10) / 10, // Temperature 20-30°C
      "2": Math.round((40 + Math.random() * 40) * 10) / 10, // Humidity 40-80%
      "3": Math.round(Math.random() * 100), // Light level 0-100%
      "4": Math.random() > 0.5 ? 1 : 0, // Status on/off
    };
  }

  /**
   * Get all devices (for monitoring purposes)
   */
  async getAllDevices() {
    const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
    const result = await dynamodb.send(new ScanCommand({
      TableName: TABLES.DEVICES
    }));

    return result.Items || [];
  }

  /**
   * Check device status and mark offline if inactive
   * Devices are marked offline if no activity for more than 5 minutes
   * Uses atomic operations to prevent race conditions
   */
  async checkDeviceInactivity() {
    const OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds
    const now = Date.now(); // Use numeric timestamp for comparison
    const devices = await this.getAllDevices();
    const statusChanges = [];

    for (const device of devices) {
      // Skip if device has never been seen or is already offline
      if (!device.lastSeen) {
        continue;
      }

      // Convert lastSeen to number if it's an ISO string
      const lastSeenTimestamp = typeof device.lastSeen === 'string' 
        ? new Date(device.lastSeen).getTime() 
        : device.lastSeen;

      const timeSinceLastSeen = now - lastSeenTimestamp;

      // Mark as offline if inactive for more than 5 minutes
      if (device.status === 'online' && timeSinceLastSeen > OFFLINE_THRESHOLD) {
        await this.updateDeviceStatus(device.deviceId, 'offline', device.lastSeen);
        statusChanges.push({
          deviceId: device.deviceId,
          deviceName: device.name,
          userId: device.userId,
          status: 'offline',
          lastSeen: device.lastSeen,
          inactiveDuration: Math.floor(timeSinceLastSeen / 1000 / 60) // minutes
        });
        console.log(`[Device Monitor] Marked device ${device.name} (${device.deviceId}) as offline - inactive for ${Math.floor(timeSinceLastSeen / 1000 / 60)} minutes`);
      }
    }

    return statusChanges;
  }
}

module.exports = new DeviceService();