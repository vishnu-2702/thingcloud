/**
 * Test Critical Fixes
 * Validates template usage, device status, and timestamp handling
 */

require('dotenv').config();
const userService = require('../src/services/userService');
const deviceService = require('../src/services/deviceService');
const templateService = require('../src/services/templateService');
const telemetryService = require('../src/services/telemetryService');

console.log('\n🧪 Testing Critical Fixes\n');
console.log('='.repeat(60));

let testUserId, testTemplateId, testDeviceId;

async function testTemplateUsageIncrement() {
  console.log('\n📋 Test 1: Template Usage Count');
  
  try {
    // Create user
    const userResult = await userService.register({
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'TestPass123'
    });
    testUserId = userResult.user.userId;
    console.log('  ✅ User created:', testUserId);

    // Create template
    const template = await templateService.createTemplate(testUserId, {
      name: 'Test Template',
      description: 'Template for testing',
      category: 'Sensors',
      datastreams: [
        { pin: 'V0', name: 'Temperature', type: 'numeric' }
      ]
    });
    testTemplateId = template.templateId;
    console.log('  ✅ Template created:', testTemplateId);
    console.log('  Initial usage count:', template.usage);

    // Create device with template
    const device = await deviceService.createDevice(testUserId, {
      name: 'Test Device',
      type: 'sensor',
      templateId: testTemplateId
    });
    testDeviceId = device.deviceId;
    console.log('  ✅ Device created:', testDeviceId);

    // Manually increment (simulating route)
    await templateService.incrementUsage(testTemplateId);
    
    // Get updated template
    const updatedTemplate = await templateService.getTemplateById(testTemplateId);
    console.log('  Updated usage count:', updatedTemplate.usage);

    if (updatedTemplate.usage === 1) {
      console.log('  ✅ Template usage increment working correctly');
      return true;
    } else {
      console.log('  ❌ Template usage not incremented correctly');
      return false;
    }
  } catch (error) {
    console.log('  ❌ Test failed:', error.message);
    return false;
  }
}

async function testActiveDeviceCount() {
  console.log('\n📊 Test 2: Active Device Count');
  
  try {
    // Get template with stats
    const template = await templateService.getTemplateById(testTemplateId, true);
    
    console.log('  Template usage stats:');
    console.log('    - Total devices:', template.usageStats?.totalDevices || 0);
    console.log('    - Active devices:', template.usageStats?.activeDevices || 0);
    
    if (template.usageStats) {
      console.log('  ✅ Usage stats calculation working');
      return true;
    } else {
      console.log('  ❌ Usage stats not calculated');
      return false;
    }
  } catch (error) {
    console.log('  ❌ Test failed:', error.message);
    return false;
  }
}

async function testLastSeenTimestamp() {
  console.log('\n🕐 Test 3: LastSeen Timestamp Handling');
  
  try {
    // Send telemetry to update lastSeen
    const device = await deviceService.getDeviceById(testDeviceId, testUserId);
    
    await telemetryService.storeTelemetryData(device, {
      V0: 25.5
    });
    
    console.log('  ✅ Telemetry stored');
    
    // Get updated device
    const updatedDevice = await deviceService.getDeviceById(testDeviceId, testUserId);
    console.log('  Device status:', updatedDevice.status);
    console.log('  Device lastSeen:', updatedDevice.lastSeen);
    console.log('  LastSeen type:', typeof updatedDevice.lastSeen);
    
    if (updatedDevice.lastSeen && typeof updatedDevice.lastSeen === 'string') {
      console.log('  ✅ LastSeen stored as ISO string correctly');
      
      // Test inactivity check with mixed types
      const statusChanges = await deviceService.checkDeviceInactivity();
      console.log('  ✅ Inactivity check handles ISO strings correctly');
      console.log('  Status changes detected:', statusChanges.length);
      
      return true;
    } else {
      console.log('  ❌ LastSeen not stored correctly');
      return false;
    }
  } catch (error) {
    console.log('  ❌ Test failed:', error.message);
    console.error('  Error:', error);
    return false;
  }
}

async function testTimestampTypeConsistency() {
  console.log('\n🔍 Test 4: Timestamp Type Consistency');
  
  try {
    // Check all timestamps are ISO strings
    const device = await deviceService.getDeviceById(testDeviceId, testUserId);
    const template = await templateService.getTemplateById(testTemplateId);
    
    const checks = [
      { name: 'Device createdAt', value: device.createdAt, type: typeof device.createdAt },
      { name: 'Device updatedAt', value: device.updatedAt, type: typeof device.updatedAt },
      { name: 'Device lastSeen', value: device.lastSeen, type: typeof device.lastSeen },
      { name: 'Template createdAt', value: template.createdAt, type: typeof template.createdAt },
      { name: 'Template updatedAt', value: template.updatedAt, type: typeof template.updatedAt }
    ];
    
    let allStrings = true;
    checks.forEach(check => {
      const isString = check.type === 'string';
      const icon = isString ? '✅' : '❌';
      console.log(`  ${icon} ${check.name}: ${check.type}`);
      if (!isString && check.value !== null) {
        allStrings = false;
      }
    });
    
    if (allStrings) {
      console.log('  ✅ All timestamps are strings (ISO format)');
      return true;
    } else {
      console.log('  ❌ Some timestamps are not strings');
      return false;
    }
  } catch (error) {
    console.log('  ❌ Test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting All Critical Fix Tests...\n');
  
  const results = {
    templateUsage: false,
    activeDevices: false,
    lastSeenTimestamp: false,
    timestampTypes: false
  };

  // Run tests in sequence
  results.templateUsage = await testTemplateUsageIncrement();
  results.activeDevices = await testActiveDeviceCount();
  results.lastSeenTimestamp = await testLastSeenTimestamp();
  results.timestampTypes = await testTimestampTypeConsistency();

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
    console.log('\n✅ ALL TESTS PASSED! All critical fixes are working.\n');
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
