/**
 * Setup RBAC (Role-Based Access Control) Tables
 * Creates DynamoDB tables for user-device permissions
 */

const { 
  DynamoDBClient, 
  CreateTableCommand, 
  DescribeTableCommand,
  waitUntilTableExists 
} = require('@aws-sdk/client-dynamodb');
require('dotenv').config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const USER_DEVICE_PERMISSIONS_TABLE = process.env.USER_DEVICE_PERMISSIONS_TABLE || 'iot-platform-user-device-permissions';

/**
 * Create User-Device Permissions table
 */
async function createUserDevicePermissionsTable() {
  const params = {
    TableName: USER_DEVICE_PERMISSIONS_TABLE,
    KeySchema: [
      { AttributeName: 'userId', KeyType: 'HASH' },  // Partition key
      { AttributeName: 'deviceId', KeyType: 'RANGE' } // Sort key
    ],
    AttributeDefinitions: [
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'deviceId', AttributeType: 'S' },
      { AttributeName: 'adminId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'AdminIdIndex',
        KeySchema: [
          { AttributeName: 'adminId', KeyType: 'HASH' }
        ],
        Projection: {
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      },
      {
        IndexName: 'DeviceIdIndex',
        KeySchema: [
          { AttributeName: 'deviceId', KeyType: 'HASH' }
        ],
        Projection: {
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  try {
    // Check if table already exists
    try {
      await client.send(new DescribeTableCommand({ TableName: USER_DEVICE_PERMISSIONS_TABLE }));
      console.log(`✅ Table ${USER_DEVICE_PERMISSIONS_TABLE} already exists`);
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
    }

    // Create table
    console.log(`Creating table: ${USER_DEVICE_PERMISSIONS_TABLE}...`);
    await client.send(new CreateTableCommand(params));
    
    // Wait for table to be active
    await waitUntilTableExists(
      { client, maxWaitTime: 60 },
      { TableName: USER_DEVICE_PERMISSIONS_TABLE }
    );
    
    console.log(`✅ Table ${USER_DEVICE_PERMISSIONS_TABLE} created successfully`);
  } catch (error) {
    console.error(`❌ Error creating table ${USER_DEVICE_PERMISSIONS_TABLE}:`, error);
    throw error;
  }
}

/**
 * Main setup function
 */
async function setup() {
  console.log('='.repeat(60));
  console.log('🔧 Setting up RBAC Tables...');
  console.log('='.repeat(60));

  try {
    await createUserDevicePermissionsTable();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ RBAC Tables setup completed successfully!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setup();
