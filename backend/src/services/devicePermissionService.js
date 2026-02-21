/**
 * Device Permission Service
 * Manages device access permissions for sub-users
 */

const { dynamodb, TABLES } = require('../config/database');
const { PutCommand, GetCommand, DeleteCommand, QueryCommand, BatchWriteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { getCurrentTimestamp, generateId } = require('../utils/helpers');

class DevicePermissionService {
  /**
   * Grant device access to a sub-user
   */
  async grantDeviceAccess(userId, deviceId, adminId, permissions = {}) {
    const permission = {
      permissionId: generateId(),
      userId,
      deviceId,
      adminId,
      permissions: {
        canView: permissions.canView !== undefined ? permissions.canView : true,
        canControl: permissions.canControl !== undefined ? permissions.canControl : false,
        canViewTelemetry: permissions.canViewTelemetry !== undefined ? permissions.canViewTelemetry : true,
        canViewAlerts: permissions.canViewAlerts !== undefined ? permissions.canViewAlerts : true,
        canModifyAlertRules: permissions.canModifyAlertRules !== undefined ? permissions.canModifyAlertRules : false
      },
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };

    await dynamodb.send(new PutCommand({
      TableName: TABLES.USER_DEVICE_PERMISSIONS,
      Item: permission
    }));

    return permission;
  }

  /**
   * Revoke device access from a sub-user
   */
  async revokeDeviceAccess(userId, deviceId) {
    const permission = await this.getDevicePermission(userId, deviceId);
    if (!permission) {
      throw new Error('Permission not found');
    }

    await dynamodb.send(new DeleteCommand({
      TableName: TABLES.USER_DEVICE_PERMISSIONS,
      Key: { permissionId: permission.permissionId }
    }));

    return { message: 'Device access revoked successfully' };
  }

  /**
   * Get device permission for a user
   */
  async getDevicePermission(userId, deviceId) {
    const result = await dynamodb.send(new ScanCommand({
      TableName: TABLES.USER_DEVICE_PERMISSIONS,
      FilterExpression: 'userId = :userId AND deviceId = :deviceId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':deviceId': deviceId
      },
      Limit: 1
    }));

    return result.Items && result.Items.length > 0 ? result.Items[0] : null;
  }

  /**
   * Get all devices accessible by a sub-user
   */
  async getUserAccessibleDevices(userId) {
    const result = await dynamodb.send(new QueryCommand({
      TableName: TABLES.USER_DEVICE_PERMISSIONS,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));

    return result.Items || [];
  }

  /**
   * Get all users with access to a device
   */
  async getDeviceAccessList(deviceId) {
    const result = await dynamodb.send(new QueryCommand({
      TableName: TABLES.USER_DEVICE_PERMISSIONS,
      IndexName: 'DeviceIdIndex',
      KeyConditionExpression: 'deviceId = :deviceId',
      ExpressionAttributeValues: {
        ':deviceId': deviceId
      }
    }));

    return result.Items || [];
  }

  /**
   * Grant multiple devices to a sub-user
   */
  async grantMultipleDevices(userId, deviceIds, adminId, permissions = {}) {
    const requests = deviceIds.map(deviceId => ({
      PutRequest: {
        Item: {
          permissionId: generateId(),
          userId,
          deviceId,
          adminId,
          permissions: {
            canView: permissions.canView !== undefined ? permissions.canView : true,
            canControl: permissions.canControl !== undefined ? permissions.canControl : false,
            canViewTelemetry: permissions.canViewTelemetry !== undefined ? permissions.canViewTelemetry : true,
            canViewAlerts: permissions.canViewAlerts !== undefined ? permissions.canViewAlerts : true,
            canModifyAlertRules: permissions.canModifyAlertRules !== undefined ? permissions.canModifyAlertRules : false
          },
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp()
        }
      }
    }));

    // DynamoDB BatchWrite has a limit of 25 items
    const chunks = [];
    for (let i = 0; i < requests.length; i += 25) {
      chunks.push(requests.slice(i, i + 25));
    }

    for (const chunk of chunks) {
      await dynamodb.send(new BatchWriteCommand({
        RequestItems: {
          [TABLES.USER_DEVICE_PERMISSIONS]: chunk
        }
      }));
    }

    return { message: `Access granted to ${deviceIds.length} devices` };
  }

  /**
   * Revoke all device access for a sub-user
   */
  async revokeAllDeviceAccess(userId) {
    const permissions = await this.getUserAccessibleDevices(userId);
    
    const requests = permissions.map(perm => ({
      DeleteRequest: {
        Key: {
          permissionId: perm.permissionId
        }
      }
    }));

    // DynamoDB BatchWrite has a limit of 25 items
    const chunks = [];
    for (let i = 0; i < requests.length; i += 25) {
      chunks.push(requests.slice(i, i + 25));
    }

    for (const chunk of chunks) {
      await dynamodb.send(new BatchWriteCommand({
        RequestItems: {
          [TABLES.USER_DEVICE_PERMISSIONS]: chunk
        }
      }));
    }

    return { message: `Access revoked from ${permissions.length} devices` };
  }

  /**
   * Update device permissions for a sub-user
   */
  async updateDevicePermissions(userId, deviceId, permissions) {
    const existing = await this.getDevicePermission(userId, deviceId);
    
    if (!existing) {
      throw new Error('Permission not found');
    }

    const updated = {
      ...existing,
      permissions: {
        ...existing.permissions,
        ...permissions
      },
      updatedAt: getCurrentTimestamp()
    };

    await dynamodb.send(new PutCommand({
      TableName: TABLES.USER_DEVICE_PERMISSIONS,
      Item: updated
    }));

    return updated;
  }

  /**
   * Check if user has permission to access device
   */
  async hasDeviceAccess(userId, deviceId) {
    const permission = await this.getDevicePermission(userId, deviceId);
    return permission !== null && permission.permissions.canView;
  }

  /**
   * Check specific permission
   */
  async checkPermission(userId, deviceId, permissionType) {
    const permission = await this.getDevicePermission(userId, deviceId);
    
    console.log('[DevicePermission] Permission check:', {
      userId,
      deviceId,
      permissionType,
      permission,
      hasPermission: permission ? permission.permissions[permissionType] : false
    });
    
    if (!permission) {
      return false;
    }

    return permission.permissions[permissionType] || false;
  }

  /**
   * Get all permissions managed by an admin
   */
  async getAdminManagedPermissions(adminId) {
    const result = await dynamodb.send(new QueryCommand({
      TableName: TABLES.USER_DEVICE_PERMISSIONS,
      IndexName: 'AdminIdIndex',
      KeyConditionExpression: 'adminId = :adminId',
      ExpressionAttributeValues: {
        ':adminId': adminId
      }
    }));

    return result.Items || [];
  }
}

module.exports = new DevicePermissionService();
