/**
 * Setup All DynamoDB Tables
 * Creates all necessary tables for the IoT Platform with proper structure and indexes
 * 
 * COST OPTIMIZATION:
 * - Uses PAY_PER_REQUEST (on-demand) billing mode to prevent over-provisioning costs
 * - Eliminates idle capacity charges - you only pay for actual read/write requests
 * - Automatically scales with traffic without manual intervention
 * - Ideal for serverless applications with variable or unpredictable workloads
 * 
 * ADDITIONAL COST SAVING STRATEGIES:
 * 1. Implement caching layer (Redis/ElastiCache) for frequently accessed data
 * 2. Use TTL to automatically expire old telemetry data
 * 3. Batch read/write operations where possible
 * 4. Query with specific filters to reduce data scanned
 * 5. Monitor CloudWatch metrics for read/write patterns
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  CreateTableCommand, 
  DescribeTableCommand,
  UpdateTimeToLiveCommand,
  ListTablesCommand
} = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Table configurations
const TABLES = {
  USERS: {
    name: process.env.USERS_TABLE || 'iot-platform-users',
    schema: {
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'email', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'EmailIndex',
          KeySchema: [
            { AttributeName: 'email', KeyType: 'HASH' }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        }
      ]
    },
    description: 'Stores user accounts and authentication data',
    attributes: [
      'userId - Primary key (UUID)',
      'email - User email (GSI)',
      'name - User full name',
      'password - Hashed password',
      'role - User role (user/admin)',
      'createdAt - Account creation timestamp',
      'lastLogin - Last login timestamp'
    ]
  },

  DEVICES: {
    name: process.env.DEVICES_TABLE || 'iot-platform-devices',
    schema: {
      KeySchema: [
        { AttributeName: 'deviceId', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'deviceId', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' },
        { AttributeName: 'apiKey', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'UserIdIndex',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' },
            { AttributeName: 'createdAt', KeyType: 'RANGE' }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        },
        {
          IndexName: 'ApiKeyIndex',
          KeySchema: [
            { AttributeName: 'apiKey', KeyType: 'HASH' }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        }
      ]
    },
    description: 'Stores registered IoT devices',
    attributes: [
      'deviceId - Primary key (UUID)',
      'userId - Device owner (GSI)',
      'name - Device name',
      'type - Device type',
      'templateId - Associated template',
      'apiKey - Device authentication key (GSI)',
      'status - online/offline',
      'lastSeen - Last activity timestamp',
      'createdAt - Registration timestamp (GSI sort key)',
      'metadata - Additional device info'
    ]
  },

  TELEMETRY: {
    name: process.env.TELEMETRY_TABLE || 'iot-platform-telemetry',
    schema: {
      KeySchema: [
        { AttributeName: 'telemetryId', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'telemetryId', AttributeType: 'S' },
        { AttributeName: 'deviceId', AttributeType: 'S' },
        { AttributeName: 'timestamp', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'DeviceIdIndex',
          KeySchema: [
            { AttributeName: 'deviceId', KeyType: 'HASH' },
            { AttributeName: 'timestamp', KeyType: 'RANGE' }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        }
      ]
    },
    description: 'Stores device telemetry data',
    ttl: true,
    ttlAttribute: 'ttl',
    attributes: [
      'telemetryId - Primary key (UUID)',
      'deviceId - Source device (GSI)',
      'userId - Device owner',
      'data - Telemetry payload (pins/values)',
      'timestamp - Data timestamp (GSI sort key)',
      'ttl - Auto-expiry timestamp (optional)'
    ]
  },

  TEMPLATES: {
    name: process.env.TEMPLATES_TABLE || 'iot-platform-templates',
    schema: {
      KeySchema: [
        { AttributeName: 'templateId', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'templateId', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'UserIdIndex',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' },
            { AttributeName: 'createdAt', KeyType: 'RANGE' }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        }
      ]
    },
    description: 'Stores device configuration templates',
    attributes: [
      'templateId - Primary key (UUID)',
      'userId - Template owner (GSI)',
      'name - Template name',
      'description - Template description',
      'category - Template category',
      'datastreams - Pin configurations',
      'deviceCount - Number of devices using template',
      'createdAt - Creation timestamp (GSI sort key)',
      'updatedAt - Last update timestamp'
    ]
  },

  ALERTS: {
    name: process.env.ALERTS_TABLE || 'iot-platform-alerts',
    schema: {
      KeySchema: [
        { AttributeName: 'alertId', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'alertId', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'UserIdIndex',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' },
            { AttributeName: 'createdAt', KeyType: 'RANGE' }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        }
      ]
    },
    description: 'Stores alerts and notifications',
    ttl: true,
    ttlAttribute: 'ttl',
    attributes: [
      'alertId - Primary key (UUID)',
      'userId - Alert owner (GSI)',
      'message - Alert message',
      'severity - critical/warning/info',
      'type - Alert type',
      'deviceId - Related device',
      'deviceName - Related device name',
      'read - Read status (boolean)',
      'status - active/resolved',
      'createdAt - Creation timestamp (GSI sort key)',
      'resolvedAt - Resolution timestamp',
      'ttl - Auto-expiry timestamp (optional)'
    ]
  },

  INVITATIONS: {
    name: process.env.INVITATIONS_TABLE || 'iot-platform-invitations',
    schema: {
      KeySchema: [
        { AttributeName: 'invitationId', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'invitationId', AttributeType: 'S' },
        { AttributeName: 'email', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'EmailIndex',
          KeySchema: [
            { AttributeName: 'email', KeyType: 'HASH' }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        }
      ]
    },
    description: 'Stores user invitations',
    ttl: true,
    ttlAttribute: 'expiresAt',
    attributes: [
      'invitationId - Primary key (UUID)',
      'email - Invited email (GSI)',
      'invitedBy - Inviter userId',
      'role - Invited user role',
      'status - pending/accepted/expired',
      'token - Invitation token',
      'createdAt - Creation timestamp',
      'expiresAt - Expiry timestamp (TTL)'
    ]
  },

  DASHBOARD_LAYOUTS: {
    name: process.env.DASHBOARD_LAYOUTS_TABLE || 'iot-platform-dashboard-layouts',
    schema: {
      KeySchema: [
        { AttributeName: 'deviceId', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'deviceId', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'UserIdIndex',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        }
      ]
    },
    description: 'Stores custom dashboard layouts for devices',
    attributes: [
      'deviceId - Primary key (device UUID)',
      'userId - User who created layout (GSI)',
      'name - Layout name',
      'widgets - Array of widget configurations',
      'gridCols - Number of grid columns (default 12)',
      'rowHeight - Height of each grid row in pixels',
      'createdAt - Creation timestamp',
      'updatedAt - Last update timestamp'
    ]
  },

  ALERT_RULES: {
    name: process.env.ALERT_RULES_TABLE || 'iot-platform-alert-rules',
    schema: {
      KeySchema: [
        { AttributeName: 'ruleId', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'ruleId', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'deviceId', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'UserIdIndex',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        },
        {
          IndexName: 'DeviceIdIndex',
          KeySchema: [
            { AttributeName: 'deviceId', KeyType: 'HASH' }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        }
      ]
    },
    description: 'Stores alert rules for automated device monitoring',
    attributes: [
      'ruleId - Primary key (UUID)',
      'userId - Rule owner (GSI)',
      'deviceId - Target device (GSI)',
      'name - Rule name',
      'description - Rule description',
      'enabled - Rule active status (boolean)',
      'conditions - Array of condition objects',
      'actions - Array of action objects',
      'priority - Rule priority level',
      'lastTriggered - Last trigger timestamp',
      'triggerCount - Number of times triggered',
      'createdAt - Creation timestamp',
      'updatedAt - Last update timestamp'
    ]
  },

  USER_DEVICE_PERMISSIONS: {
    name: process.env.USER_DEVICE_PERMISSIONS_TABLE || 'iot-platform-user-device-permissions',
    schema: {
      KeySchema: [
        { AttributeName: 'permissionId', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'permissionId', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'deviceId', AttributeType: 'S' },
        { AttributeName: 'adminId', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'UserIdIndex',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        },
        {
          IndexName: 'DeviceIdIndex',
          KeySchema: [
            { AttributeName: 'deviceId', KeyType: 'HASH' }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        },
        {
          IndexName: 'AdminIdIndex',
          KeySchema: [
            { AttributeName: 'adminId', KeyType: 'HASH' }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        }
      ]
    },
    description: 'Stores user permissions for shared devices (RBAC)',
    attributes: [
      'permissionId - Primary key (UUID)',
      'userId - User with permission (GSI)',
      'deviceId - Shared device (GSI)',
      'adminId - Admin who manages permissions (GSI)',
      'ownerId - Device owner userId',
      'permission - Permission level (view/control/admin)',
      'grantedBy - User who granted permission',
      'createdAt - Permission grant timestamp',
      'expiresAt - Optional expiry timestamp'
    ]
  }
};

/**
 * Check if a table exists
 */
async function tableExists(tableName) {
  try {
    const command = new DescribeTableCommand({ TableName: tableName });
    const result = await client.send(command);
    return {
      exists: true,
      status: result.Table.TableStatus,
      itemCount: result.Table.ItemCount || 0,
      gsiStatus: result.Table.GlobalSecondaryIndexes?.map(gsi => ({
        name: gsi.IndexName,
        status: gsi.IndexStatus
      })) || []
    };
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return { exists: false };
    }
    throw error;
  }
}

/**
 * Create a table
 */
async function createTable(tableKey, tableConfig) {
  console.log(`\n📝 Creating table: ${tableConfig.name}`);
  console.log(`   Description: ${tableConfig.description}`);

  const params = {
    TableName: tableConfig.name,
    ...tableConfig.schema,
    BillingMode: 'PAY_PER_REQUEST', // On-demand billing to prevent over-provisioning costs
    Tags: [
      { Key: 'Project', Value: 'IoT-Platform' },
      { Key: 'Environment', Value: process.env.NODE_ENV || 'development' },
      { Key: 'TableType', Value: tableKey }
    ]
  };

  const createCommand = new CreateTableCommand(params);
  await client.send(createCommand);
  
  console.log(`✅ Table "${tableConfig.name}" created successfully!`);
  console.log(`⏳ Waiting for table to become active...`);
  
  // Wait for table to be active
  let isActive = false;
  let attempts = 0;
  const maxAttempts = 30; // 30 attempts * 5 seconds = 2.5 minutes max wait
  
  while (!isActive && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    const describeCommand = new DescribeTableCommand({ TableName: tableConfig.name });
    const tableInfo = await client.send(describeCommand);
    isActive = tableInfo.Table.TableStatus === 'ACTIVE';
    
    if (!isActive) {
      attempts++;
      console.log(`   Status: ${tableInfo.Table.TableStatus} (attempt ${attempts}/${maxAttempts})`);
    }
  }
  
  if (isActive) {
    console.log(`✅ Table is now ACTIVE!`);
    
    // Enable TTL if configured
    if (tableConfig.ttl) {
      try {
        const ttlCommand = new UpdateTimeToLiveCommand({
          TableName: tableConfig.name,
          TimeToLiveSpecification: {
            Enabled: true,
            AttributeName: tableConfig.ttlAttribute
          }
        });
        await client.send(ttlCommand);
        console.log(`✅ TTL enabled on '${tableConfig.ttlAttribute}' attribute`);
      } catch (ttlError) {
        console.log(`⚠️  TTL setup skipped:`, ttlError.message);
      }
    }
  } else {
    console.log(`⚠️  Table creation timeout. Check AWS Console.`);
  }
}

/**
 * Display table information
 */
function displayTableInfo(tableKey, tableConfig, status) {
  console.log(`\n📊 ${tableKey} Table: ${tableConfig.name}`);
  console.log(`   Description: ${tableConfig.description}`);
  console.log(`   Status: ✅ ${status.status}`);
  console.log(`   Items: ${status.itemCount}`);
  
  if (status.gsiStatus && status.gsiStatus.length > 0) {
    console.log(`   Indexes:`);
    status.gsiStatus.forEach(gsi => {
      console.log(`     - ${gsi.name}: ${gsi.status}`);
    });
  }
}

/**
 * Main setup function
 */
async function setupAllTables() {
  console.log('🚀 IoT Platform - DynamoDB Tables Setup\n');
  console.log('=' .repeat(60));
  
  try {
    // Validate AWS credentials
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('\n❌ AWS credentials not found in environment variables');
      console.error('Please ensure your .env file contains:');
      console.error('  AWS_ACCESS_KEY_ID=your-access-key');
      console.error('  AWS_SECRET_ACCESS_KEY=your-secret-key');
      console.error('  AWS_REGION=your-region');
      process.exit(1);
    }

    console.log(`\n🔍 Checking existing tables in region: ${process.env.AWS_REGION || 'us-east-1'}`);
    
    const results = {
      existing: [],
      created: [],
      failed: []
    };

    // Check and create each table
    for (const [tableKey, tableConfig] of Object.entries(TABLES)) {
      try {
        const status = await tableExists(tableConfig.name);
        
        if (status.exists) {
          displayTableInfo(tableKey, tableConfig, status);
          results.existing.push(tableConfig.name);
        } else {
          await createTable(tableKey, tableConfig);
          results.created.push(tableConfig.name);
        }
      } catch (error) {
        console.error(`\n❌ Error with table ${tableConfig.name}:`, error.message);
        results.failed.push({ name: tableConfig.name, error: error.message });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📋 SETUP SUMMARY\n');
    
    if (results.existing.length > 0) {
      console.log(`✅ Existing tables (${results.existing.length}):`);
      results.existing.forEach(name => console.log(`   - ${name}`));
    }
    
    if (results.created.length > 0) {
      console.log(`\n🎉 Created tables (${results.created.length}):`);
      results.created.forEach(name => console.log(`   - ${name}`));
    }
    
    if (results.failed.length > 0) {
      console.log(`\n❌ Failed tables (${results.failed.length}):`);
      results.failed.forEach(item => console.log(`   - ${item.name}: ${item.error}`));
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📚 Table Structure Reference:\n');
    
    Object.entries(TABLES).forEach(([key, config]) => {
      console.log(`${key}: ${config.name}`);
      console.log(`  ${config.description}`);
      console.log(`  Attributes:`);
      config.attributes.forEach(attr => console.log(`    • ${attr}`));
      console.log('');
    });

    if (results.failed.length > 0) {
      console.log('⚠️  Some tables failed to create. Check the errors above.');
      process.exit(1);
    } else {
      console.log('✅ All tables are ready!');
      console.log('\n🎯 Next steps:');
      console.log('   1. Verify tables in AWS Console');
      console.log('   2. Start your backend server');
      console.log('   3. Register a user and test the platform');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupAllTables();
