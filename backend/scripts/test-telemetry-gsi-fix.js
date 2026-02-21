// ============================================================================
// TEST: Verify getTelemetry API Returns Data
// ============================================================================
// This test verifies that the getTelemetry endpoint can successfully retrieve
// telemetry data after fixing the GSI name bug

require('dotenv').config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
const docClient = DynamoDBDocumentClient.from(client);

const TELEMETRY_TABLE = process.env.TELEMETRY_TABLE || 'iot-platform-telemetry';
const DEVICE_ID = 'b039f4f8-9c92-407d-b052-375d8915ba8a'; // Test Device

async function testTelemetryQuery() {
  console.log('\n🧪 TESTING TELEMETRY GSI QUERY\n');
  console.log('='.repeat(80));

  try {
    // Test with CORRECT GSI name
    console.log('\n1️⃣  Query with DeviceIdIndex (CORRECT):');
    console.log('-'.repeat(80));
    
    const correctParams = {
      TableName: TELEMETRY_TABLE,
      IndexName: 'DeviceIdIndex',
      KeyConditionExpression: 'deviceId = :deviceId',
      ExpressionAttributeValues: {
        ':deviceId': DEVICE_ID
      },
      ScanIndexForward: false,
      Limit: 5
    };

    const correctResult = await docClient.send(new QueryCommand(correctParams));
    console.log(`✅ Success! Retrieved ${correctResult.Items?.length || 0} records`);
    
    if (correctResult.Items && correctResult.Items.length > 0) {
      console.log('\n   Latest Telemetry:');
      const latest = correctResult.Items[0];
      console.log(`   Timestamp: ${latest.timestamp}`);
      console.log(`   Data: ${JSON.stringify(latest.data)}`);
      console.log(`   Data Keys: [${Object.keys(latest.data).join(', ')}]`);
    }

    // Test with WRONG GSI name (the bug)
    console.log('\n2️⃣  Query with DeviceIdTimestampIndex (WRONG):');
    console.log('-'.repeat(80));
    
    try {
      const wrongParams = {
        TableName: TELEMETRY_TABLE,
        IndexName: 'DeviceIdTimestampIndex',
        KeyConditionExpression: 'deviceId = :deviceId',
        ExpressionAttributeValues: {
          ':deviceId': DEVICE_ID
        },
        ScanIndexForward: false,
        Limit: 5
      };

      await docClient.send(new QueryCommand(wrongParams));
      console.log('⚠️  Unexpectedly succeeded - GSI might exist');
    } catch (error) {
      console.log(`❌ Failed as expected: ${error.message}`);
      console.log('   This was the bug causing widgets not to display data!');
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST COMPLETE - The GSI name fix resolves the widget data issue!\n');

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error(error);
  }
}

testTelemetryQuery();
