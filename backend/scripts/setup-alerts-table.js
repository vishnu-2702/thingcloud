/**
 * Setup Alerts Table
 * Creates the alerts table with proper structure and indexes
 */

require('dotenv').config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  CreateTableCommand, 
  DescribeTableCommand,
  UpdateTimeToLiveCommand 
} = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const tableName = process.env.ALERTS_TABLE || 'iot-platform-alerts';

async function setupAlertsTable() {
  try {
    console.log(`🔍 Checking if table "${tableName}" exists...`);
    
    // Try to describe the table
    try {
      const describeCommand = new DescribeTableCommand({ TableName: tableName });
      const tableInfo = await client.send(describeCommand);
      console.log(`✅ Table "${tableName}" already exists`);
      console.log(`   Status: ${tableInfo.Table.TableStatus}`);
      console.log(`   Item count: ${tableInfo.Table.ItemCount || 0}`);
      
      // Check if UserIdIndex exists
      const hasUserIdIndex = tableInfo.Table.GlobalSecondaryIndexes?.some(
        gsi => gsi.IndexName === 'UserIdIndex'
      );
      
      if (hasUserIdIndex) {
        console.log(`✅ UserIdIndex GSI exists`);
      } else {
        console.log(`⚠️  WARNING: UserIdIndex GSI is missing!`);
        console.log(`   Alert queries by userId will fail.`);
        console.log(`   You need to manually add the GSI in AWS Console:`);
        console.log(`   - Index name: UserIdIndex`);
        console.log(`   - Partition key: userId (String)`);
        console.log(`   - Sort key: createdAt (String)`);
      }
      
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
      console.log(`📝 Table "${tableName}" does not exist. Creating...`);
    }

    // Create the table
    const createTableParams = {
      TableName: tableName,
      KeySchema: [
        { AttributeName: 'alertId', KeyType: 'HASH' } // Partition key
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
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }
      ],
      BillingMode: 'PROVISIONED',
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      },
      Tags: [
        { Key: 'Project', Value: 'IoT-Platform' },
        { Key: 'Environment', Value: process.env.NODE_ENV || 'development' }
      ]
    };

    const createCommand = new CreateTableCommand(createTableParams);
    await client.send(createCommand);
    
    console.log(`✅ Table "${tableName}" created successfully!`);
    console.log(`⏳ Waiting for table to become active...`);
    
    // Wait for table to be active
    let isActive = false;
    while (!isActive) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const describeCommand = new DescribeTableCommand({ TableName: tableName });
      const tableInfo = await client.send(describeCommand);
      isActive = tableInfo.Table.TableStatus === 'ACTIVE';
      console.log(`   Status: ${tableInfo.Table.TableStatus}`);
    }
    
    console.log(`✅ Table is now active!`);
    
    // Enable TTL (optional - for auto-deleting old alerts)
    try {
      const ttlCommand = new UpdateTimeToLiveCommand({
        TableName: tableName,
        TimeToLiveSpecification: {
          Enabled: true,
          AttributeName: 'ttl'
        }
      });
      await client.send(ttlCommand);
      console.log(`✅ TTL enabled on 'ttl' attribute (optional - not used by default)`);
    } catch (ttlError) {
      console.log(`⚠️  TTL setup skipped:`, ttlError.message);
    }
    
    console.log('\n🎉 Alerts table setup complete!');
    console.log('\nTable structure:');
    console.log('  Primary Key: alertId (String)');
    console.log('  GSI: UserIdIndex');
    console.log('    - Partition key: userId (String)');
    console.log('    - Sort key: createdAt (String)');
    console.log('\nAttributes:');
    console.log('  - alertId: Unique alert identifier');
    console.log('  - userId: User who owns the alert');
    console.log('  - message: Alert message');
    console.log('  - severity: critical | warning | info');
    console.log('  - type: device_offline | device_online | system | telemetry | error');
    console.log('  - deviceId: Related device (optional)');
    console.log('  - deviceName: Related device name (optional)');
    console.log('  - description: Detailed description');
    console.log('  - metadata: Additional data (JSON)');
    console.log('  - read: Boolean (false by default)');
    console.log('  - status: active | resolved');
    console.log('  - createdAt: ISO timestamp');
    console.log('  - resolvedAt: ISO timestamp (when resolved)');
    
  } catch (error) {
    console.error('❌ Error setting up alerts table:', error);
    throw error;
  }
}

// Run the setup
setupAlertsTable()
  .then(() => {
    console.log('\n✅ Setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });
