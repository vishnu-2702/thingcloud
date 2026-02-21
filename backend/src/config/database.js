/**
 * Database Configuration
 * AWS DynamoDB client setup and configuration
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

// Validate AWS credentials
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error('❌ AWS credentials not found in environment variables');
  console.error('Please ensure your .env file contains:');
  console.error('  AWS_ACCESS_KEY_ID=your-access-key');
  console.error('  AWS_SECRET_ACCESS_KEY=your-secret-key');
  console.error('  AWS_REGION=your-region');
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AWS credentials required for production');
  }
  process.exit(1);
}

// Create DynamoDB client
const dynamodbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Create document client for easier operations
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient);

// Database table names
const TABLES = {
  USERS: process.env.USERS_TABLE || 'iot-platform-users',
  DEVICES: process.env.DEVICES_TABLE || 'iot-platform-devices',
  TELEMETRY: process.env.TELEMETRY_TABLE || 'iot-platform-telemetry',
  TEMPLATES: process.env.TEMPLATES_TABLE || 'iot-platform-templates',
  ALERTS: process.env.ALERTS_TABLE || 'iot-platform-alerts',
  ALERT_RULES: process.env.ALERT_RULES_TABLE || 'iot-platform-alert-rules',
  INVITATIONS: process.env.INVITATIONS_TABLE || 'iot-platform-invitations',
  USER_DEVICE_PERMISSIONS: process.env.USER_DEVICE_PERMISSIONS_TABLE || 'iot-platform-user-device-permissions',
  DASHBOARD_LAYOUTS: process.env.DASHBOARD_LAYOUTS_TABLE || 'iot-platform-dashboard-layouts'
};

module.exports = {
  dynamodb,
  dynamodbClient,
  TABLES
};