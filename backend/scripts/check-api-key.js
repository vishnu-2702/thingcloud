/**
 * Quick Test - Check if Device API Key Exists
 */

require('dotenv').config();
const { dynamodb, TABLES } = require('../src/config/database');
const { QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const TEST_API_KEY = '17482860-8cc8-4b2e-a0a7-ff520da7a020';

async function checkApiKey() {
  console.log('\n🔍 Checking Device with API Key:', TEST_API_KEY);
  console.log('='.repeat(60));
  
  try {
    // Try to query using ApiKeyIndex
    console.log('\n📋 Attempting query with ApiKeyIndex GSI...');
    const result = await dynamodb.send(new QueryCommand({
      TableName: TABLES.DEVICES,
      IndexName: 'ApiKeyIndex',
      KeyConditionExpression: 'apiKey = :apiKey',
      ExpressionAttributeValues: {
        ':apiKey': TEST_API_KEY
      }
    }));
    
    console.log('✅ Query successful!');
    console.log('Devices found:', result.Items?.length || 0);
    
    if (result.Items && result.Items.length > 0) {
      const device = result.Items[0];
      console.log('\n📱 Device Details:');
      console.log('  Device ID:', device.deviceId);
      console.log('  Name:', device.name);
      console.log('  User ID:', device.userId);
      console.log('  Status:', device.status);
      console.log('  API Key:', device.apiKey);
      return true;
    } else {
      console.log('\n⚠️  No device found with this API key');
      console.log('The API key does not exist in the database.');
      return false;
    }
  } catch (error) {
    console.error('\n❌ Query failed:', error.message);
    
    if (error.message.includes('ResourceNotFoundException')) {
      console.log('\n⚠️  ApiKeyIndex GSI does not exist!');
      console.log('You need to create the ApiKeyIndex on the Devices table.');
      console.log('\nTo fix this, the table schema should include:');
      console.log(`
GlobalSecondaryIndexes: [
  {
    IndexName: 'ApiKeyIndex',
    KeySchema: [
      { AttributeName: 'apiKey', KeyType: 'HASH' }
    ],
    Projection: { ProjectionType: 'ALL' }
  }
]
      `);
    }
    
    return false;
  }
}

async function listAllDevices() {
  console.log('\n📋 Listing all devices in table...');
  console.log('='.repeat(60));
  
  try {
    const result = await dynamodb.send(new ScanCommand({
      TableName: TABLES.DEVICES
    }));
    
    console.log('Total devices:', result.Items?.length || 0);
    
    if (result.Items && result.Items.length > 0) {
      console.log('\nDevices:');
      result.Items.forEach((device, index) => {
        console.log(`\n${index + 1}. ${device.name || 'Unnamed'}`);
        console.log(`   Device ID: ${device.deviceId}`);
        console.log(`   API Key: ${device.apiKey}`);
        console.log(`   User ID: ${device.userId}`);
        console.log(`   Status: ${device.status}`);
      });
    } else {
      console.log('\n⚠️  No devices in the table');
    }
  } catch (error) {
    console.error('\n❌ Scan failed:', error.message);
  }
}

async function run() {
  const apiKeyExists = await checkApiKey();
  await listAllDevices();
  
  console.log('\n' + '='.repeat(60));
  if (!apiKeyExists) {
    console.log('\n⚠️  The provided API key does not exist in the database.');
    console.log('Please use one of the API keys listed above, or create a new device.');
    process.exit(1);
  } else {
    console.log('\n✅ API key is valid and exists in the database!');
    process.exit(0);
  }
}

run().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
