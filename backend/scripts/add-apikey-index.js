/**
 * Add ApiKeyIndex GSI to Existing Devices Table
 * This script adds the missing GSI without deleting data
 */

require('dotenv').config();
const { DynamoDBClient, UpdateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const TABLE_NAME = process.env.DEVICES_TABLE || 'iot-platform-devices';

async function addApiKeyIndex() {
  console.log('\n🔧 Adding ApiKeyIndex GSI to Devices Table\n');
  console.log('='.repeat(60));
  console.log(`\nTable: ${TABLE_NAME}`);
  
  try {
    // First check if GSI already exists
    console.log('\n📋 Checking current table configuration...');
    const describeResult = await client.send(new DescribeTableCommand({
      TableName: TABLE_NAME
    }));
    
    const existingGSIs = describeResult.Table.GlobalSecondaryIndexes || [];
    const apiKeyIndexExists = existingGSIs.some(gsi => gsi.IndexName === 'ApiKeyIndex');
    
    if (apiKeyIndexExists) {
      console.log('✅ ApiKeyIndex GSI already exists!');
      console.log('\nNothing to do. The index is already configured.');
      return;
    }
    
    console.log('⚠️  ApiKeyIndex GSI does not exist. Adding it now...');
    
    // Add the GSI
    const params = {
      TableName: TABLE_NAME,
      AttributeDefinitions: [
        {
          AttributeName: 'apiKey',
          AttributeType: 'S'
        }
      ],
      GlobalSecondaryIndexUpdates: [
        {
          Create: {
            IndexName: 'ApiKeyIndex',
            KeySchema: [
              {
                AttributeName: 'apiKey',
                KeyType: 'HASH'
              }
            ],
            Projection: {
              ProjectionType: 'ALL'
            }
          }
        }
      ]
    };
    
    console.log('\n🚀 Creating GSI...');
    console.log('   Index Name: ApiKeyIndex');
    console.log('   Key: apiKey (HASH)');
    console.log('   Projection: ALL');
    
    await client.send(new UpdateTableCommand(params));
    
    console.log('\n✅ GSI creation initiated successfully!');
    console.log('\n⏳ The GSI is now being created in the background.');
    console.log('   This may take a few minutes depending on table size.');
    console.log('   Status will change: CREATING → ACTIVE');
    console.log('\n💡 You can check the status in AWS Console:');
    console.log('   DynamoDB → Tables → ' + TABLE_NAME + ' → Indexes');
    
  } catch (error) {
    console.error('\n❌ Error adding GSI:', error.message);
    
    if (error.name === 'ResourceNotFoundException') {
      console.error('\n⚠️  Table does not exist!');
      console.error('   Please run: node scripts/setup-all-tables.js');
    } else if (error.name === 'ValidationException') {
      console.error('\n⚠️  Validation error:', error.message);
    } else if (error.name === 'LimitExceededException') {
      console.error('\n⚠️  You have reached the limit for GSI operations.');
      console.error('   Please wait a few minutes and try again.');
    }
    
    throw error;
  }
}

async function waitForIndexActive() {
  console.log('\n⏳ Waiting for ApiKeyIndex to become ACTIVE...');
  
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max
  
  while (attempts < maxAttempts) {
    try {
      const result = await client.send(new DescribeTableCommand({
        TableName: TABLE_NAME
      }));
      
      const apiKeyIndex = result.Table.GlobalSecondaryIndexes?.find(
        gsi => gsi.IndexName === 'ApiKeyIndex'
      );
      
      if (!apiKeyIndex) {
        console.log('   ❌ Index not found');
        break;
      }
      
      const status = apiKeyIndex.IndexStatus;
      console.log(`   Status: ${status} (attempt ${attempts + 1}/${maxAttempts})`);
      
      if (status === 'ACTIVE') {
        console.log('\n✅ ApiKeyIndex is now ACTIVE!');
        console.log('   You can now use the telemetry API with device API keys.');
        return true;
      }
      
      if (status === 'DELETING') {
        console.log('\n❌ Index is being deleted');
        return false;
      }
      
      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    } catch (error) {
      console.error('   ❌ Error checking status:', error.message);
      break;
    }
  }
  
  if (attempts >= maxAttempts) {
    console.log('\n⏰ Timeout waiting for index to become active');
    console.log('   The index is still being created. Please check AWS Console.');
  }
  
  return false;
}

async function run() {
  try {
    await addApiKeyIndex();
    
    console.log('\n' + '='.repeat(60));
    console.log('\n⏳ Do you want to wait for the index to become active?');
    console.log('   This will poll every 5 seconds until ACTIVE (max 5 minutes)');
    console.log('\n   Press Ctrl+C to skip and check manually later.');
    
    // Wait 3 seconds to allow user to cancel
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const isActive = await waitForIndexActive();
    
    console.log('\n' + '='.repeat(60));
    if (isActive) {
      console.log('\n✅ Setup complete! You can now test the telemetry API.');
      console.log('   Run: node scripts/test-telemetry-api-auth.js\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  Index is still being created.');
      console.log('   Please wait a few minutes and check AWS Console.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

run();
