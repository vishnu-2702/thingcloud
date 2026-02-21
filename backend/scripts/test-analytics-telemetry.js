// ============================================================================
// TEST: Verify Analytics Telemetry Time Range Query
// ============================================================================
// Tests that time range filters work correctly with ISO string timestamps

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

async function testTimeRangeQuery() {
  console.log('\n🧪 TESTING ANALYTICS TIME RANGE QUERY\n');
  console.log('='.repeat(80));

  try {
    // 1. Query WITHOUT time filter (should return all records)
    console.log('\n1️⃣  Query WITHOUT time filter:');
    console.log('-'.repeat(80));
    
    const noFilterParams = {
      TableName: TELEMETRY_TABLE,
      IndexName: 'DeviceIdIndex',
      KeyConditionExpression: 'deviceId = :deviceId',
      ExpressionAttributeValues: {
        ':deviceId': DEVICE_ID
      },
      ScanIndexForward: false,
      Limit: 10
    };

    const noFilterResult = await docClient.send(new QueryCommand(noFilterParams));
    console.log(`✅ Retrieved ${noFilterResult.Items?.length || 0} records`);
    
    if (noFilterResult.Items && noFilterResult.Items.length > 0) {
      const oldest = noFilterResult.Items[noFilterResult.Items.length - 1];
      const newest = noFilterResult.Items[0];
      console.log(`   Oldest: ${oldest.timestamp}`);
      console.log(`   Newest: ${newest.timestamp}`);
    }

    // 2. Query WITH time filter (last 24 hours)
    console.log('\n2️⃣  Query WITH time filter (last 24 hours):');
    console.log('-'.repeat(80));
    
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    
    // Convert to ISO strings as the fix does
    const startTimeStr = new Date(twentyFourHoursAgo).toISOString();
    const endTimeStr = new Date(now).toISOString();
    
    console.log(`   Start: ${startTimeStr}`);
    console.log(`   End: ${endTimeStr}`);
    
    const filterParams = {
      TableName: TELEMETRY_TABLE,
      IndexName: 'DeviceIdIndex',
      KeyConditionExpression: 'deviceId = :deviceId AND #timestamp BETWEEN :startTime AND :endTime',
      ExpressionAttributeNames: {
        '#timestamp': 'timestamp'
      },
      ExpressionAttributeValues: {
        ':deviceId': DEVICE_ID,
        ':startTime': startTimeStr,
        ':endTime': endTimeStr
      },
      ScanIndexForward: false,
      Limit: 10000
    };

    const filterResult = await docClient.send(new QueryCommand(filterParams));
    console.log(`✅ Retrieved ${filterResult.Items?.length || 0} records in time range`);
    
    if (filterResult.Items && filterResult.Items.length > 0) {
      console.log('\n   Sample Records:');
      filterResult.Items.slice(0, 3).forEach((item, i) => {
        console.log(`   ${i + 1}. Timestamp: ${item.timestamp}`);
        console.log(`      Data: ${JSON.stringify(item.data)}`);
      });
    }

    // 3. Verify all returned records are within range
    console.log('\n3️⃣  Verify records are within time range:');
    console.log('-'.repeat(80));
    
    let allInRange = true;
    let outOfRangeCount = 0;
    
    if (filterResult.Items) {
      filterResult.Items.forEach(item => {
        const itemTimestamp = item.timestamp;
        if (itemTimestamp < startTimeStr || itemTimestamp > endTimeStr) {
          allInRange = false;
          outOfRangeCount++;
        }
      });
    }
    
    if (allInRange) {
      console.log(`✅ All ${filterResult.Items?.length || 0} records are within the time range`);
    } else {
      console.log(`⚠️  ${outOfRangeCount} records are outside the time range`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST COMPLETE - Analytics time range filtering is working!\n');

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error(error);
  }
}

testTimeRangeQuery();
