/**
 * Template Service
 * Business logic for device template management
 */

const { dynamodb, TABLES } = require('../config/database');
const { GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { formatTemplateData, generateId, getCurrentTimestamp } = require('../utils/helpers');

class TemplateService {
  /**
   * Create a new template
   */
  async createTemplate(userId, templateData) {
    const { name, description, category, datastreams } = templateData;
    const templateId = generateId();

    const template = {
      templateId,
      userId,
      name,
      description: description || '',
      category: category || 'general',
      datastreams: datastreams || [],
      usage: 0,
      isPublic: false,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };

    await dynamodb.send(new PutCommand({
      TableName: TABLES.TEMPLATES,
      Item: template
    }));

    return formatTemplateData(template);
  }

  /**
   * Get user's templates
   */
  async getUserTemplates(userId) {
    const result = await dynamodb.send(new QueryCommand({
      TableName: TABLES.TEMPLATES,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));

    return (result.Items || []).map(formatTemplateData);
  }

  /**
   * Get all templates (including public ones)
   */
  async getAllTemplates(userId) {
    const userTemplates = await this.getUserTemplates(userId);
    
    // Add public templates for users with no templates
    const publicTemplates = userTemplates.length === 0 ? this.getPublicTemplates() : [];
    
    return [...userTemplates, ...publicTemplates];
  }

  /**
   * Get public templates
   */
  getPublicTemplates() {
    return [
      {
        id: 'public-esp8266-basic',
        templateId: 'public-esp8266-basic',
        name: 'ESP8266 Basic Sensor',
        description: 'Basic ESP8266 template with temperature and humidity sensors',
        category: 'sensor',
        datastreams: [
          { virtualPin: 'V0', name: 'Temperature', dataType: 'number', unit: '°C' },
          { virtualPin: 'V1', name: 'Humidity', dataType: 'number', unit: '%' },
          { virtualPin: 'V2', name: 'Status', dataType: 'string' }
        ],
        usage: 15,
        isPublic: true,
        userId: 'public',
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
      },
      {
        id: 'public-esp32-advanced',
        templateId: 'public-esp32-advanced',
        name: 'ESP32 Multi-Sensor',
        description: 'Advanced ESP32 template with multiple sensors and actuators',
        category: 'automation',
        datastreams: [
          { virtualPin: 'V0', name: 'Temperature', dataType: 'number', unit: '°C' },
          { virtualPin: 'V1', name: 'Humidity', dataType: 'number', unit: '%' },
          { virtualPin: 'V2', name: 'Light Level', dataType: 'number', unit: 'lux' },
          { virtualPin: 'V3', name: 'Motion', dataType: 'boolean' },
          { virtualPin: 'V4', name: 'LED Control', dataType: 'boolean' }
        ],
        usage: 28,
        isPublic: true,
        userId: 'public',
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
      }
    ];
  }

  /**
   * Get template by ID with usage statistics
   */
  async getTemplateById(templateId, includeStats = false) {
    // Check for public templates first
    const publicTemplates = this.getPublicTemplates();
    const publicTemplate = publicTemplates.find(t => t.templateId === templateId);
    if (publicTemplate) {
      if (includeStats) {
        publicTemplate.usageStats = await this.getTemplateUsageStats(templateId);
      }
      return publicTemplate;
    }

    // Get from database
    const result = await dynamodb.send(new GetCommand({
      TableName: TABLES.TEMPLATES,
      Key: { templateId }
    }));

    if (!result.Item) {
      return null;
    }

    // Add usage stats if requested
    if (includeStats) {
      result.Item.usageStats = await this.getTemplateUsageStats(templateId);
    }

    return result.Item;
  }

  /**
   * Get template with ownership check
   */
  async getTemplateByIdForUser(templateId, userId, includeStats = true) {
    const template = await this.getTemplateById(templateId, includeStats);
    
    if (!template) {
      throw new Error('Template not found');
    }

    // Allow access to public templates
    if (template.isPublic || template.userId === 'public') {
      return template;
    }

    if (template.userId !== userId) {
      throw new Error('Access denied');
    }

    return template;
  }

  /**
   * Update template
   */
  async updateTemplate(templateId, userId, updateData) {
    const template = await this.getTemplateByIdForUser(templateId, userId);
    
    // Don't allow updating public templates
    if (template.isPublic || template.userId === 'public') {
      throw new Error('Cannot update public templates');
    }

    const { name, description, category, datastreams } = updateData;

    const updateParams = {
      TableName: TABLES.TEMPLATES,
      Key: { templateId },
      UpdateExpression: 'SET #name = :name, description = :description, category = :category, datastreams = :datastreams, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':name': name,
        ':description': description || '',
        ':category': category || 'general',
        ':datastreams': datastreams || [],
        ':updatedAt': getCurrentTimestamp()
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamodb.send(new UpdateCommand(updateParams));
    return formatTemplateData(result.Attributes);
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId, userId) {
    const template = await this.getTemplateByIdForUser(templateId, userId);
    
    // Don't allow deleting public templates
    if (template.isPublic || template.userId === 'public') {
      throw new Error('Cannot delete public templates');
    }

    await dynamodb.send(new DeleteCommand({
      TableName: TABLES.TEMPLATES,
      Key: { templateId }
    }));

    return { message: 'Template deleted successfully' };
  }

  /**
   * Clone template
   */
  async cloneTemplate(templateId, userId, newName = null) {
    const originalTemplate = await this.getTemplateById(templateId);
    
    if (!originalTemplate) {
      throw new Error('Template not found');
    }

    // Create cloned template
    const clonedTemplate = {
      name: newName || `${originalTemplate.name} (Copy)`,
      description: originalTemplate.description,
      category: originalTemplate.category,
      datastreams: [...(originalTemplate.datastreams || [])]
    };

    return await this.createTemplate(userId, clonedTemplate);
  }

  /**
   * Increment template usage count
   */
  async incrementUsage(templateId) {
    // Skip for public templates
    const template = await this.getTemplateById(templateId);
    if (template && !template.isPublic && template.userId !== 'public') {
      await dynamodb.send(new UpdateCommand({
        TableName: TABLES.TEMPLATES,
        Key: { templateId },
        UpdateExpression: 'ADD #usage :inc',
        ExpressionAttributeNames: {
          '#usage': 'usage'
        },
        ExpressionAttributeValues: {
          ':inc': 1
        }
      }));
    }
  }

  /**
   * Get template categories
   */
  getCategories() {
    return ['sensor', 'automation', 'monitoring', 'control', 'general'];
  }

  /**
   * Get template usage statistics (devices using template, active devices)
   */
  async getTemplateUsageStats(templateId) {
    const deviceService = require('./deviceService');
    const allDevices = await deviceService.getAllDevices();
    
    // Filter devices using this template
    const devicesUsingTemplate = allDevices.filter(d => d.templateId === templateId);
    
    // Count active devices (online status)
    const activeDevices = devicesUsingTemplate.filter(d => {
      if (d.status === 'online') return true;
      if (!d.lastSeen) return false;
      
      // Check if device was seen in last 5 minutes
      const lastSeenTimestamp = typeof d.lastSeen === 'string' 
        ? new Date(d.lastSeen).getTime() 
        : d.lastSeen;
      const timeSinceLastSeen = Date.now() - lastSeenTimestamp;
      return timeSinceLastSeen < (5 * 60 * 1000); // 5 minutes
    }).length;
    
    return {
      totalDevices: devicesUsingTemplate.length,
      activeDevices: activeDevices
    };
  }
}

module.exports = new TemplateService();