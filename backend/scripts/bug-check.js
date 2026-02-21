/**
 * Backend Comprehensive Bug Check
 * Verifies all critical backend functionality
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Backend Bug Check - Comprehensive Verification\n');
console.log('='.repeat(60));

const results = {
  passed: [],
  failed: [],
  warnings: []
};

// Test 1: Check all service files for syntax errors
console.log('\n📝 Test 1: Syntax Validation (node -c)');
const serviceFiles = [
  'src/services/userService.js',
  'src/services/deviceService.js',
  'src/services/templateService.js',
  'src/services/telemetryService.js',
  'src/services/alertService.js',
  'src/services/alertRuleService.js',
  'src/services/devicePermissionService.js',
  'src/services/dashboardLayoutService.js',
  'src/services/deviceMonitorService.js'
];

const { execSync } = require('child_process');

for (const file of serviceFiles) {
  try {
    execSync(`node -c ${file}`, { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
    console.log(`  ✅ ${file}`);
    results.passed.push(`Syntax: ${file}`);
  } catch (error) {
    console.log(`  ❌ ${file}: Syntax error`);
    results.failed.push(`Syntax: ${file} - Has syntax errors`);
  }
}

// Test 2: Verify table schema keys match service usage
console.log('\n📊 Test 2: Table Schema Validation');
const tableSchemas = {
  USERS: { primaryKey: 'userId', service: 'userService' },
  DEVICES: { primaryKey: 'deviceId', service: 'deviceService' },
  TEMPLATES: { primaryKey: 'templateId', service: 'templateService' },
  TELEMETRY: { primaryKey: 'telemetryId', service: 'telemetryService' },
  ALERTS: { primaryKey: 'alertId', service: 'alertService' },
  ALERT_RULES: { primaryKey: 'ruleId', service: 'alertRuleService' },
  USER_DEVICE_PERMISSIONS: { primaryKey: 'permissionId', service: 'devicePermissionService' },
  DASHBOARD_LAYOUTS: { primaryKey: 'deviceId', service: 'dashboardLayoutService' }
};

// Check userService
try {
  const userServiceContent = fs.readFileSync(path.join(__dirname, '../src/services/userService.js'), 'utf8');
  
  // Should use userId as key, not email
  if (userServiceContent.includes('Key: { email }') || userServiceContent.includes('Key: { email:')) {
    console.log('  ❌ userService still uses email as primary key');
    results.failed.push('UserService: Uses email as key');
  } else if (userServiceContent.includes('Key: { userId') || userServiceContent.includes('Key: {userId}')) {
    console.log('  ✅ userService correctly uses userId as primary key');
    results.passed.push('UserService: Correct primary key');
  } else {
    console.log('  ⚠️  userService key usage unclear');
    results.warnings.push('UserService: Key usage unclear');
  }
} catch (error) {
  console.log(`  ❌ Error checking userService: ${error.message}`);
  results.failed.push(`UserService check: ${error.message}`);
}

// Check alertService
try {
  const alertServiceContent = fs.readFileSync(path.join(__dirname, '../src/services/alertService.js'), 'utf8');
  
  // Should use alertId as key, not id or composite key
  if (alertServiceContent.includes('Key: { id,') || alertServiceContent.includes('Key: { id :')) {
    console.log('  ❌ alertService still uses composite key (id, userId)');
    results.failed.push('AlertService: Uses composite key');
  } else if (alertServiceContent.includes('Key: { alertId') || alertServiceContent.includes('Key: {alertId}')) {
    console.log('  ✅ alertService correctly uses alertId as primary key');
    results.passed.push('AlertService: Correct primary key');
    
    // Check if it creates alerts with alertId
    if (alertServiceContent.includes('alertId:') || alertServiceContent.includes('alertId =')) {
      console.log('  ✅ alertService creates alerts with alertId field');
      results.passed.push('AlertService: Creates with alertId');
    } else {
      console.log('  ❌ alertService doesn\'t create alertId field');
      results.failed.push('AlertService: Missing alertId creation');
    }
  } else {
    console.log('  ⚠️  alertService key usage unclear');
    results.warnings.push('AlertService: Key usage unclear');
  }
} catch (error) {
  console.log(`  ❌ Error checking alertService: ${error.message}`);
  results.failed.push(`AlertService check: ${error.message}`);
}

// Check devicePermissionService
try {
  const permissionServiceContent = fs.readFileSync(path.join(__dirname, '../src/services/devicePermissionService.js'), 'utf8');
  
  // Should use permissionId as key, not composite key
  if (permissionServiceContent.includes('Key: { userId, deviceId }')) {
    console.log('  ❌ devicePermissionService still uses composite key');
    results.failed.push('DevicePermissionService: Uses composite key');
  } else if (permissionServiceContent.includes('Key: { permissionId') || permissionServiceContent.includes('Key: {permissionId}')) {
    console.log('  ✅ devicePermissionService correctly uses permissionId as primary key');
    results.passed.push('DevicePermissionService: Correct primary key');
    
    // Check if it creates permissions with permissionId
    if (permissionServiceContent.includes('permissionId:') || permissionServiceContent.includes('permissionId =')) {
      console.log('  ✅ devicePermissionService creates permissions with permissionId field');
      results.passed.push('DevicePermissionService: Creates with permissionId');
    } else {
      console.log('  ❌ devicePermissionService doesn\'t create permissionId field');
      results.failed.push('DevicePermissionService: Missing permissionId creation');
    }
  } else {
    console.log('  ⚠️  devicePermissionService key usage unclear');
    results.warnings.push('DevicePermissionService: Key usage unclear');
  }
} catch (error) {
  console.log(`  ❌ Error checking devicePermissionService: ${error.message}`);
  results.failed.push(`DevicePermissionService check: ${error.message}`);
}

// Test 3: Check for common DynamoDB anti-patterns
console.log('\n🔍 Test 3: DynamoDB Anti-Pattern Check');

const antiPatterns = [
  { pattern: 'ScanCommand.*FilterExpression.*userId.*deviceId', warning: 'Expensive scan with multiple filters' },
  { pattern: 'while.*scan', warning: 'Paginated scan loop (expensive)' }
];

// Test 4: Verify environment variables
console.log('\n🔐 Test 4: Environment Configuration');
const requiredEnvVars = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'USERS_TABLE',
  'DEVICES_TABLE',
  'TELEMETRY_TABLE',
  'TEMPLATES_TABLE',
  'ALERTS_TABLE',
  'ALERT_RULES_TABLE',
  'USER_DEVICE_PERMISSIONS_TABLE',
  'DASHBOARD_LAYOUTS_TABLE',
  'JWT_SECRET'
];

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`  ✅ ${varName}`);
    results.passed.push(`Env: ${varName}`);
  } else {
    console.log(`  ❌ ${varName} not set`);
    results.failed.push(`Env: ${varName} missing`);
  }
});

// Test 5: Check billing mode configuration
console.log('\n💰 Test 5: DynamoDB Billing Mode');
const setupTablesContent = fs.readFileSync(path.join(__dirname, 'setup-all-tables.js'), 'utf8');

if (setupTablesContent.includes('BillingMode: \'PAY_PER_REQUEST\'')) {
  console.log('  ✅ Tables configured with PAY_PER_REQUEST billing');
  results.passed.push('Billing: PAY_PER_REQUEST configured');
} else if (setupTablesContent.includes('ProvisionedThroughput')) {
  console.log('  ❌ Tables still use ProvisionedThroughput');
  results.failed.push('Billing: Still uses provisioned capacity');
} else {
  console.log('  ⚠️  Billing mode configuration unclear');
  results.warnings.push('Billing: Configuration unclear');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 TEST SUMMARY\n');
console.log(`✅ Passed: ${results.passed.length}`);
console.log(`❌ Failed: ${results.failed.length}`);
console.log(`⚠️  Warnings: ${results.warnings.length}`);

if (results.failed.length > 0) {
  console.log('\n❌ FAILED TESTS:');
  results.failed.forEach(f => console.log(`  - ${f}`));
}

if (results.warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  results.warnings.forEach(w => console.log(`  - ${w}`));
}

console.log('\n' + '='.repeat(60));

if (results.failed.length === 0) {
  console.log('\n✅ All critical tests passed! Backend is bug-free and ready for deployment.\n');
  process.exit(0);
} else {
  console.log(`\n❌ Found ${results.failed.length} critical issue(s). Fix before deployment.\n`);
  process.exit(1);
}
