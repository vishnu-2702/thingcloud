/**
 * Setup Alert Rules Table
 * Creates the DynamoDB table for storing device-specific alert rules
 */

require('dotenv').config();

const { CreateTableCommand } = require('@aws-sdk/client-dynamodb');
const { dynamodbClient, TABLES } = require('../src/config/database');

async function setupAlertRulesTable() {
  const tableName = TABLES.ALERT_RULES || 'iot-platform-alert-rules';

  console.log(`\n🔧 Setting up Alert Rules table: ${tableName}\n`);

  const params = {
    TableName: tableName,
    KeySchema: [
      { AttributeName: 'ruleId', KeyType: 'HASH' } // Partition key
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
    },
    Tags: [
      {
        Key: 'Environment',
        Value: process.env.NODE_ENV || 'development'
      },
      {
        Key: 'Application',
        Value: 'IoT-Platform'
      },
      {
        Key: 'TableType',
        Value: 'AlertRules'
      }
    ]
  };

  try {
    const command = new CreateTableCommand(params);
    await dynamodbClient.send(command);
    
    console.log('✅ Alert Rules table created successfully!');
    console.log('\n📋 Table Configuration:');
    console.log(`   Table Name: ${tableName}`);
    console.log(`   Partition Key: ruleId (S)`);
    console.log(`   GSI 1: UserIdIndex (userId)`);
    console.log(`   GSI 2: DeviceIdIndex (deviceId)`);
    console.log(`   Read Capacity: 5 units`);
    console.log(`   Write Capacity: 5 units`);
    console.log('\n⏳ Table is being created. It may take a minute to be fully active.\n');
    
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('ℹ️  Alert Rules table already exists!');
      console.log(`   Table Name: ${tableName}\n`);
    } else {
      console.error('❌ Error creating Alert Rules table:', error.message);
      throw error;
    }
  }
}

// Run if executed directly
if (require.main === module) {
  setupAlertRulesTable()
    .then(() => {
      console.log('✨ Alert Rules table setup complete!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = setupAlertRulesTable;
