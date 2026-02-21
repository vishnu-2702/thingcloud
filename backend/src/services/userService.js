/**
 * User Service
 * Business logic for user management
 */

const { dynamodb, TABLES } = require('../config/database');
const { GetCommand, PutCommand, UpdateCommand, DeleteCommand, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { hashPassword, verifyPassword, generateToken } = require('../utils/auth');
const { formatUserData, generateId, getCurrentTimestamp } = require('../utils/helpers');

class UserService {
  /**
   * Register a new user (always admin for public registration)
   */
  async register(userData) {
    const { email, password, name } = userData;

    // Check if user already exists
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create new user - PUBLIC REGISTRATION ALWAYS CREATES ADMIN
    const userId = generateId();
    const hashedPassword = await hashPassword(password);
    
    const user = {
      userId,
      email,
      password: hashedPassword,
      name,
      role: 'admin', // All public registrations are admins
      adminId: null, // Admins don't have a parent admin
      status: 'active',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      deviceCount: 0,
      subUserCount: 0
    };

    await dynamodb.send(new PutCommand({
      TableName: TABLES.USERS,
      Item: user
    }));

    const token = generateToken(user);
    
    return {
      token,
      user: formatUserData(user)
    };
  }

  /**
   * Login user
   */
  async login(email, password) {
    const user = await this.getUserByEmail(email);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = generateToken(user);

    return {
      token,
      user: formatUserData(user)
    };
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    const result = await dynamodb.send(new QueryCommand({
      TableName: TABLES.USERS,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    }));

    return result.Items && result.Items.length > 0 ? result.Items[0] : null;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    const result = await dynamodb.send(new GetCommand({
      TableName: TABLES.USERS,
      Key: { userId }
    }));

    return result.Item;
  }

  /**
   * Get user count
   */
  async getUserCount() {
    const result = await dynamodb.send(new ScanCommand({
      TableName: TABLES.USERS,
      Select: 'COUNT'
    }));

    return result.Count;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, profileData) {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updateParams = {
      TableName: TABLES.USERS,
      Key: { userId: user.userId },
      UpdateExpression: 'SET updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':updatedAt': getCurrentTimestamp()
      }
    };

    // Build dynamic update expression
    const updates = [];
    if (profileData.displayName !== undefined) {
      updates.push('displayName = :displayName');
      updateParams.ExpressionAttributeValues[':displayName'] = profileData.displayName;
    }
    if (profileData.preferences !== undefined) {
      updates.push('preferences = :preferences');
      updateParams.ExpressionAttributeValues[':preferences'] = profileData.preferences;
    }

    if (updates.length > 0) {
      updateParams.UpdateExpression += ', ' + updates.join(', ');
    }

    await dynamodb.send(new UpdateCommand(updateParams));

    return await this.getUserById(userId);
  }

  /**
   * Change user password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await verifyPassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    const hashedNewPassword = await hashPassword(newPassword);

    await dynamodb.send(new UpdateCommand({
      TableName: TABLES.USERS,
      Key: { userId: user.userId },
      UpdateExpression: 'SET password = :password, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':password': hashedNewPassword,
        ':updatedAt': getCurrentTimestamp()
      }
    }));

    return { message: 'Password changed successfully' };
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers() {
    const result = await dynamodb.send(new ScanCommand({
      TableName: TABLES.USERS,
      ProjectionExpression: 'userId, email, #name, #role, #status, createdAt, deviceCount',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#role': 'role', 
        '#status': 'status'
      }
    }));

    return result.Items.map(formatUserData);
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId, newRole) {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await dynamodb.send(new UpdateCommand({
      TableName: TABLES.USERS,
      Key: { userId: user.userId },
      UpdateExpression: 'SET #role = :role, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#role': 'role'
      },
      ExpressionAttributeValues: {
        ':role': newRole,
        ':updatedAt': getCurrentTimestamp()
      }
    }));

    return { message: 'User role updated successfully' };
  }

  /**
   * Update user status (admin only)
   */
  async updateUserStatus(userId, newStatus) {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await dynamodb.send(new UpdateCommand({
      TableName: TABLES.USERS,
      Key: { userId: user.userId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': newStatus,
        ':updatedAt': getCurrentTimestamp()
      }
    }));

    return { message: 'User status updated successfully' };
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(userId) {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await dynamodb.send(new DeleteCommand({
      TableName: TABLES.USERS,
      Key: { userId: user.userId }
    }));

    return { message: 'User deleted successfully' };
  }

  /**
   * Increment user device count
   */
  async incrementDeviceCount(userId) {
    const user = await this.getUserById(userId);
    if (user) {
      await dynamodb.send(new UpdateCommand({
        TableName: TABLES.USERS,
        Key: { userId: user.userId },
        UpdateExpression: 'ADD deviceCount :inc',
        ExpressionAttributeValues: {
          ':inc': 1
        }
      }));
    }
  }

  /**
   * Decrement user device count
   */
  async decrementDeviceCount(userId) {
    const user = await this.getUserById(userId);
    if (user) {
      await dynamodb.send(new UpdateCommand({
        TableName: TABLES.USERS,
        Key: { userId: user.userId },
        UpdateExpression: 'ADD deviceCount :dec',
        ExpressionAttributeValues: {
          ':dec': -1
        }
      }));
    }
  }

  /**
   * Create sub-user (admin only)
   */
  async createSubUser(adminId, subUserData) {
    const { email, password, name, permissions } = subUserData;

    // Verify admin exists and is actually an admin
    const admin = await this.getUserById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }
    if (admin.role !== 'admin') {
      throw new Error('Only admins can create sub-users');
    }

    // Check if user already exists
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create sub-user
    const userId = generateId();
    const hashedPassword = await hashPassword(password);
    
    const user = {
      userId,
      email,
      password: hashedPassword,
      name,
      role: 'sub-user',
      adminId, // Link to parent admin
      status: 'active',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      deviceCount: 0,
      permissions: permissions || {
        canViewDevices: true,
        canControlDevices: false,
        canDeleteDevices: false,
        canViewTelemetry: true,
        canViewAlerts: true
      }
    };

    await dynamodb.send(new PutCommand({
      TableName: TABLES.USERS,
      Item: user
    }));

    // Increment admin's sub-user count
    await this.incrementSubUserCount(adminId);

    return formatUserData(user);
  }

  /**
   * Get sub-users for an admin
   */
  async getSubUsers(adminId) {
    const result = await dynamodb.send(new ScanCommand({
      TableName: TABLES.USERS,
      FilterExpression: 'adminId = :adminId',
      ExpressionAttributeValues: {
        ':adminId': adminId
      }
    }));

    return result.Items ? result.Items.map(formatUserData) : [];
  }

  /**
   * Update sub-user permissions (admin only)
   */
  async updateSubUserPermissions(adminId, subUserId, permissions) {
    const subUser = await this.getUserById(subUserId);
    
    if (!subUser) {
      throw new Error('Sub-user not found');
    }

    // Verify the sub-user belongs to this admin
    if (subUser.adminId !== adminId) {
      throw new Error('Access denied: You can only manage your own sub-users');
    }

    await dynamodb.send(new UpdateCommand({
      TableName: TABLES.USERS,
      Key: { userId: subUser.userId },
      UpdateExpression: 'SET permissions = :permissions, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':permissions': permissions,
        ':updatedAt': getCurrentTimestamp()
      }
    }));

    return { message: 'Sub-user permissions updated successfully' };
  }

  /**
   * Delete sub-user (admin only)
   */
  async deleteSubUser(adminId, subUserId) {
    const subUser = await this.getUserById(subUserId);
    
    if (!subUser) {
      throw new Error('Sub-user not found');
    }

    // Verify the sub-user belongs to this admin
    if (subUser.adminId !== adminId) {
      throw new Error('Access denied: You can only delete your own sub-users');
    }

    await dynamodb.send(new DeleteCommand({
      TableName: TABLES.USERS,
      Key: { userId: subUser.userId }
    }));

    // Decrement admin's sub-user count
    await this.decrementSubUserCount(adminId);

    return { message: 'Sub-user deleted successfully' };
  }

  /**
   * Increment sub-user count
   */
  async incrementSubUserCount(adminId) {
    const admin = await this.getUserById(adminId);
    if (admin) {
      await dynamodb.send(new UpdateCommand({
        TableName: TABLES.USERS,
        Key: { userId: admin.userId },
        UpdateExpression: 'ADD subUserCount :inc',
        ExpressionAttributeValues: {
          ':inc': 1
        }
      }));
    }
  }

  /**
   * Decrement sub-user count
   */
  async decrementSubUserCount(adminId) {
    const admin = await this.getUserById(adminId);
    if (admin) {
      await dynamodb.send(new UpdateCommand({
        TableName: TABLES.USERS,
        Key: { userId: admin.userId },
        UpdateExpression: 'ADD subUserCount :dec',
        ExpressionAttributeValues: {
          ':dec': -1
        }
      }));
    }
  }

  /**
   * Check if user is admin
   */
  async isAdmin(userId) {
    const user = await this.getUserById(userId);
    return user && user.role === 'admin';
  }

  /**
   * Check if user is sub-user
   */
  async isSubUser(userId) {
    const user = await this.getUserById(userId);
    return user && user.role === 'sub-user';
  }

  /**
   * Get admin for a sub-user
   */
  async getAdminForSubUser(subUserId) {
    const subUser = await this.getUserById(subUserId);
    if (!subUser || !subUser.adminId) {
      return null;
    }
    return await this.getUserById(subUser.adminId);
  }
}

module.exports = new UserService();