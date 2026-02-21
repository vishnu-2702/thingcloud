/**
 * Test Telemetry Endpoint
 * Validates telemetry storage with timestamp handling
 */

require('dotenv').config();
const userService = require('../src/services/userService');
const deviceService = require('../src/services/deviceService');
const telemetryService = require('../src/services/telemetryService');
const { dynamodb, TABLES } = require('../src/config/database');
const { QueryCommand } = require('@aws-sdk/lib-dynamodb');

console.log('\n🧪 Testing Telemetry Endpoint\n');
console.log('='.repeat(60));

let testUserId, testDeviceId;

async function testTelemetryStorage() {
  console.log('\n📡 Test 1: Store Telemetry Data');
  
  try {
    // Create user
    const userResult = await userService.register({
      name: 'Telemetry Test User',
      email: `telemetry-test-${Date.now()}@example.com`,
      password: 'TestPass123'
    });
    testUserId = userResult.user.userId;
    console.log('  ✅ User created:', testUserId);

    // Create device
    const device = await deviceService.createDevice(testUserId, {
      name: 'Test Telemetry Device',
      type: 'sensor'
    });
    testDeviceId = device.deviceId;
    console.log('  ✅ Device created:', testDeviceId);
    console.log('  Device API Key:', device.apiKey);

    // Store telemetry data
    const telemetryData = {
      V0: 25.5,
      V1: 60.2,
      V2: 'Active'
    };

    console.log('  Sending telemetry data:', JSON.stringify(telemetryData));
    
    const result = await telemetryService.storeTelemetryData(device, telemetryData);
    
    console.log('  ✅ Telemetry stored successfully!');
    console.log('  Telemetry ID:', result.telemetryId);
    console.log('  Timestamp:', result.timestamp);
    console.log('  Timestamp type:', typeof result.timestamp);
    
    if (typeof result.timestamp !== 'string') {
      console.log('  ❌ ERROR: Timestamp is not a string!');
      return false;
    }

    // Verify ISO format
    try {
      const date = new Date(result.timestamp);
      if (isNaN(date.getTime())) {
        console.log('  ❌ ERROR: Timestamp is not a valid ISO string!');
        return false;
      }
      console.log('  ✅ Timestamp is valid ISO format');
    } catch (e) {
      console.log('  ❌ ERROR: Timestamp cannot be parsed as date!');
      return false;
    }

    return true;
  } catch (error) {
    console.log('  ❌ Test failed:', error.message);
    console.error('  Full error:', error);
    return false;
  }
}

async function testTelemetryQuery() {
  console.log('\n🔍 Test 2: Query Telemetry Data (GSI with timestamp)');
  
  try {
    // Query using DeviceIdIndex GSI
    const result = await dynamodb.send(new QueryCommand({
      TableName: TABLES.TELEMETRY,
      IndexName: 'DeviceIdIndex',
      KeyConditionExpression: 'deviceId = :deviceId',
      ExpressionAttributeValues: {
        ':deviceId': testDeviceId
      },
      ScanIndexForward: false, // Sort by timestamp descending
      Limit: 10
    }));

    console.log('  Query returned:', result.Items?.length || 0, 'items');
    
    if (result.Items && result.Items.length > 0) {
      const item = result.Items[0];
      console.log('  First item timestamp:', item.timestamp);
      console.log('  Timestamp type:', typeof item.timestamp);
      console.log('  Data:', JSON.stringify(item.data));
      
      if (typeof item.timestamp === 'string') {
        console.log('  ✅ GSI query working with string timestamps');
        return true;
      } else {
        console.log('  ❌ ERROR: Timestamp in query result is not a string!');
        return false;
      }
    } else {
      console.log('  ❌ ERROR: No items returned from query');
      return false;
    }
  } catch (error) {
    console.log('  ❌ Query failed:', error.message);
    console.error('  Full error:', error);
    return false;
  }
}

async function testMultipleTelemetryEntries() {
  console.log('\n📊 Test 3: Multiple Telemetry Entries (GSI Sort Order)');
  
  try {
    const device = await deviceService.getDeviceById(testDeviceId, testUserId);
    
    // Store 3 more telemetry entries with slight delays
    for (let i = 1; i <= 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      await telemetryService.storeTelemetryData(device, {
        V0: 20 + i,
        V1: 50 + i * 5
      });
      console.log(`  ✅ Stored telemetry entry ${i}`);
    }

    // Query all telemetry for this device
    const result = await dynamodb.send(new QueryCommand({
      TableName: TABLES.TELEMETRY,
      IndexName: 'DeviceIdIndex',
      KeyConditionExpression: 'deviceId = :deviceId',
      ExpressionAttributeValues: {
        ':deviceId': testDeviceId
      },
      ScanIndexForward: false // Newest first
    }));

    console.log('  Total telemetry entries:', result.Items?.length || 0);
    
    if (result.Items && result.Items.length >= 4) {
      // Check if timestamps are sorted correctly (newest first)
      const timestamps = result.Items.map(item => new Date(item.timestamp).getTime());
      let isSorted = true;
      for (let i = 0; i < timestamps.length - 1; i++) {
        if (timestamps[i] < timestamps[i + 1]) {
          isSorted = false;
          break;
        }
      }
      
      if (isSorted) {
        console.log('  ✅ Timestamps sorted correctly (descending)');
        console.log('  First entry timestamp:', result.Items[0].timestamp);
        console.log('  Last entry timestamp:', result.Items[result.Items.length - 1].timestamp);
        return true;
      } else {
        console.log('  ❌ ERROR: Timestamps not sorted correctly');
        return false;
      }
    } else {
      console.log('  ❌ ERROR: Expected at least 4 entries, got', result.Items?.length || 0);
      return false;
    }
  } catch (error) {
    console.log('  ❌ Test failed:', error.message);
    console.error('  Full error:', error);
    return false;
  }
}

async function testDeviceStatusUpdate() {
  console.log('\n🔄 Test 4: Device Status Update (lastSeen timestamp)');
  
  try {
    // Get device after telemetry
    const device = await deviceService.getDeviceById(testDeviceId, testUserId);
    
    console.log('  Device status:', device.status);
    console.log('  Device lastSeen:', device.lastSeen);
    console.log('  LastSeen type:', typeof device.lastSeen);
    
    if (device.status === 'online' && device.lastSeen && typeof device.lastSeen === 'string') {
      console.log('  ✅ Device status updated correctly with ISO timestamp');
      return true;
    } else {
      console.log('  ❌ ERROR: Device status or lastSeen not updated correctly');
      return false;
    }
  } catch (error) {
    console.log('  ❌ Test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting Telemetry Endpoint Tests...\n');
  
  const results = {
    telemetryStorage: false,
    telemetryQuery: false,
    multipleTelemetry: false,
    deviceStatus: false
  };

  // Run tests in sequence
  results.telemetryStorage = await testTelemetryStorage();
  results.telemetryQuery = await testTelemetryQuery();
  results.multipleTelemetry = await testMultipleTelemetryEntries();
  results.deviceStatus = await testDeviceStatusUpdate();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY\n');
  
  const passed = Object.values(results).filter(r => r === true).length;
  const total = Object.keys(results).length;

  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}\n`);

  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✅' : '❌';
    const name = test.replace(/([A-Z])/g, ' $1').trim();
    console.log(`  ${status} ${name}`);
  });

  console.log('\n' + '='.repeat(60));

  if (passed === total) {
    console.log('\n✅ ALL TESTS PASSED! Telemetry endpoint is working correctly.\n');
    process.exit(0);
  } else {
    console.log(`\n❌ ${total - passed} TEST(S) FAILED! Check errors above.\n`);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Fatal error running tests:', error);
  process.exit(1);
});
