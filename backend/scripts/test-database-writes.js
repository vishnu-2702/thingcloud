/**
 * Test Database Write Operations
 * Tests all create/insert operations to verify data insertion
 */

require('dotenv').config();
const path = require('path');
const { dynamodb, TABLES } = require('../src/config/database');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const userService = require('../src/services/userService');
const deviceService = require('../src/services/deviceService');
const templateService = require('../src/services/templateService');
const alertService = require('../src/services/alertService');

console.log('\n🧪 Testing Database Write Operations\n');
console.log('='.repeat(60));

async function testDirectWrite() {
  console.log('\n📝 Test 1: Direct DynamoDB Write');
  
  const testData = {
    userId: `test-${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    name: 'Test User Direct',
    password: 'hashed-password',
    role: 'admin',
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    deviceCount: 0,
    subUserCount: 0
  };

  console.log('  Data to insert:', JSON.stringify(testData, null, 2));

  try {
    await dynamodb.send(new PutCommand({
      TableName: TABLES.USERS,
      Item: testData
    }));
    console.log('  ✅ Direct write successful!');
    return true;
  } catch (error) {
    console.log('  ❌ Direct write failed:', error.message);
    console.error('  Full error:', error);
    return false;
  }
}

async function testUserRegistration() {
  console.log('\n👤 Test 2: User Registration via userService');
  
  const userData = {
    name: 'Test User Service',
    email: `test-service-${Date.now()}@example.com`,
    password: 'TestPassword123'
  };

  console.log('  Input data:', JSON.stringify(userData, null, 2));

  try {
    const result = await userService.register(userData);
    console.log('  ✅ User registration successful!');
    console.log('  Created userId:', result.user.userId);
    return { success: true, userId: result.user.userId };
  } catch (error) {
    console.log('  ❌ User registration failed:', error.message);
    console.error('  Full error:', error);
    return { success: false, error: error.message };
  }
}

async function testDeviceCreation(userId) {
  console.log('\n📱 Test 3: Device Creation via deviceService');
  
  const deviceData = {
    name: 'Test Device',
    type: 'sensor',
    description: 'Test device for validation',
    metadata: {
      location: 'test-lab',
      model: 'TEST-001'
    }
  };

  console.log('  Input data:', JSON.stringify(deviceData, null, 2));
  console.log('  User ID:', userId);

  try {
    const result = await deviceService.createDevice(userId, deviceData);
    console.log('  ✅ Device creation successful!');
    console.log('  Created deviceId:', result.deviceId);
    console.log('  Generated API Key:', result.apiKey);
    return { success: true, deviceId: result.deviceId };
  } catch (error) {
    console.log('  ❌ Device creation failed:', error.message);
    console.error('  Full error:', error);
    return { success: false, error: error.message };
  }
}

async function testTemplateCreation(userId) {
  console.log('\n📋 Test 4: Template Creation via templateService');
  
  const templateData = {
    name: 'Test Template',
    description: 'Test template for validation',
    category: 'Sensors',
    datastreams: [
      {
        pin: 'V0',
        name: 'Temperature',
        type: 'numeric',
        unit: '°C',
        minValue: -50,
        maxValue: 150
      }
    ]
  };

  console.log('  Input data:', JSON.stringify(templateData, null, 2));
  console.log('  User ID:', userId);

  try {
    const result = await templateService.createTemplate(userId, templateData);
    console.log('  ✅ Template creation successful!');
    console.log('  Created templateId:', result.templateId);
    return { success: true, templateId: result.templateId };
  } catch (error) {
    console.log('  ❌ Template creation failed:', error.message);
    console.error('  Full error:', error);
    return { success: false, error: error.message };
  }
}

async function testAlertCreation(userId, deviceId) {
  console.log('\n🔔 Test 5: Alert Creation via alertService');
  
  const alertData = {
    message: 'Test Alert',
    severity: 'info',
    type: 'system',
    deviceId: deviceId,
    deviceName: 'Test Device',
    description: 'Test alert for validation'
  };

  console.log('  Input data:', JSON.stringify(alertData, null, 2));
  console.log('  User ID:', userId);

  try {
    const result = await alertService.createAlert(userId, alertData);
    console.log('  ✅ Alert creation successful!');
    console.log('  Created alertId:', result.alertId);
    return { success: true, alertId: result.alertId };
  } catch (error) {
    console.log('  ❌ Alert creation failed:', error.message);
    console.error('  Full error:', error);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting All Write Operation Tests...\n');
  
  const results = {
    directWrite: false,
    userRegistration: false,
    deviceCreation: false,
    templateCreation: false,
    alertCreation: false
  };

  let userId, deviceId;

  // Test 1: Direct write
  results.directWrite = await testDirectWrite();

  // Test 2: User registration
  const userResult = await testUserRegistration();
  results.userRegistration = userResult.success;
  userId = userResult.userId;

  if (userId) {
    // Test 3: Device creation
    const deviceResult = await testDeviceCreation(userId);
    results.deviceCreation = deviceResult.success;
    deviceId = deviceResult.deviceId;

    // Test 4: Template creation
    const templateResult = await testTemplateCreation(userId);
    results.templateCreation = templateResult.success;

    // Test 5: Alert creation
    if (deviceId) {
      const alertResult = await testAlertCreation(userId, deviceId);
      results.alertCreation = alertResult.success;
    }
  }

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
    console.log('\n✅ ALL TESTS PASSED! Database writes are working correctly.\n');
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
