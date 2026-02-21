/**
 * Pre-Deployment Verification Script
 * Checks all critical components before deployment
 */

const path = require('path');
const fs = require('fs');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`)
};

let errors = [];
let warnings = [];

console.log('\n🚀 IoT Platform - Pre-Deployment Verification\n');
console.log('='.repeat(60));

/**
 * Check 1: Verify required files exist
 */
function checkRequiredFiles() {
  console.log('\n📁 Checking Required Files...');
  
  const requiredFiles = [
    'package.json',
    'src/server.js',
    'src/config/database.js',
    'src/config/app.js',
    'src/utils/cache.js',
    '.env.example',
    'vercel.json'
  ];

  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      log.success(`${file} exists`);
    } else {
      log.error(`${file} missing`);
      errors.push(`Missing file: ${file}`);
    }
  });
}

/**
 * Check 2: Verify package.json dependencies
 */
function checkDependencies() {
  console.log('\n📦 Checking Dependencies...');
  
  const packagePath = path.join(__dirname, '..', 'package.json');
  const pkg = require(packagePath);
  
  const requiredDeps = [
    '@aws-sdk/client-dynamodb',
    '@aws-sdk/lib-dynamodb',
    'express',
    'cors',
    'dotenv',
    'bcryptjs',
    'jsonwebtoken',
    'socket.io',
    'uuid'
  ];

  requiredDeps.forEach(dep => {
    if (pkg.dependencies && pkg.dependencies[dep]) {
      log.success(`${dep} installed`);
    } else {
      log.error(`${dep} missing from dependencies`);
      errors.push(`Missing dependency: ${dep}`);
    }
  });
}

/**
 * Check 3: Validate environment variables
 */
function checkEnvironmentVariables() {
  console.log('\n🔐 Checking Environment Configuration...');
  
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  
  const requiredVars = [
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'JWT_SECRET',
    'FRONTEND_URL'
  ];

  const tableVars = [
    'USERS_TABLE',
    'DEVICES_TABLE',
    'TELEMETRY_TABLE',
    'TEMPLATES_TABLE',
    'ALERTS_TABLE',
    'ALERT_RULES_TABLE',
    'INVITATIONS_TABLE',
    'USER_DEVICE_PERMISSIONS_TABLE',
    'DASHBOARD_LAYOUTS_TABLE'
  ];

  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      log.success(`${varName} is set`);
    } else {
      log.error(`${varName} not set`);
      errors.push(`Missing environment variable: ${varName}`);
    }
  });

  tableVars.forEach(varName => {
    if (process.env[varName]) {
      log.success(`${varName} is set`);
    } else {
      log.warning(`${varName} not set (using default)`);
      warnings.push(`Using default for: ${varName}`);
    }
  });

  // Check JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    log.warning('JWT_SECRET is less than 32 characters - consider using a stronger secret');
    warnings.push('Weak JWT_SECRET (< 32 chars)');
  }
}

/**
 * Check 4: Test module imports
 */
async function testModuleImports() {
  console.log('\n📚 Testing Module Imports...');
  
  const modules = [
    { name: 'Cache Utility', path: '../src/utils/cache.js' },
    { name: 'Database Config', path: '../src/config/database.js' },
    { name: 'App Config', path: '../src/config/app.js' },
    { name: 'Device Service', path: '../src/services/deviceService.js' },
    { name: 'Telemetry Service', path: '../src/services/telemetryService.js' },
    { name: 'Alert Service', path: '../src/services/alertService.js' }
  ];

  for (const module of modules) {
    try {
      require(module.path);
      log.success(`${module.name} imports successfully`);
    } catch (error) {
      log.error(`${module.name} import failed: ${error.message}`);
      errors.push(`Module import error: ${module.name}`);
    }
  }
}

/**
 * Check 5: Verify AWS credentials
 */
async function verifyAWSCredentials() {
  console.log('\n☁️  Verifying AWS Credentials...');
  
  try {
    const { DynamoDBClient, ListTablesCommand } = require('@aws-sdk/client-dynamodb');
    
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    const command = new ListTablesCommand({ Limit: 1 });
    await client.send(command);
    
    log.success('AWS credentials are valid');
    log.success('DynamoDB connection successful');
  } catch (error) {
    log.error(`AWS connection failed: ${error.message}`);
    errors.push('Invalid AWS credentials or connection issue');
  }
}

/**
 * Check 6: Test cache utility
 */
async function testCacheUtility() {
  console.log('\n💾 Testing Cache Utility...');
  
  try {
    const { SimpleCache, deviceCache } = require('../src/utils/cache.js');
    
    // Test basic operations
    deviceCache.set('test-key', { data: 'test' }, 1000);
    const result = deviceCache.get('test-key');
    
    if (result && result.data === 'test') {
      log.success('Cache set/get working');
    } else {
      log.error('Cache set/get failed');
      errors.push('Cache functionality broken');
    }

    // Test expiration (async)
    return new Promise((resolve) => {
      deviceCache.set('expire-test', 'value', 10);
      setTimeout(() => {
        const expired = deviceCache.get('expire-test');
        if (expired === null) {
          log.success('Cache expiration working');
        } else {
          log.warning('Cache expiration may not be working correctly');
          warnings.push('Cache expiration issue detected');
        }
        log.success('Cache utility operational');
        resolve();
      }, 20);
    });
  } catch (error) {
    log.error(`Cache test failed: ${error.message}`);
    errors.push('Cache utility error');
  }
}

/**
 * Check 7: Verify table names are consistent
 */
function verifyTableNames() {
  console.log('\n📋 Verifying Table Configuration...');
  
  try {
    const { TABLES } = require('../src/config/database.js');
    const expectedTables = [
      'USERS',
      'DEVICES',
      'TELEMETRY',
      'TEMPLATES',
      'ALERTS',
      'ALERT_RULES',
      'INVITATIONS',
      'USER_DEVICE_PERMISSIONS',
      'DASHBOARD_LAYOUTS'
    ];

    expectedTables.forEach(tableName => {
      if (TABLES[tableName]) {
        log.success(`${tableName} table configured`);
      } else {
        log.error(`${tableName} table not configured`);
        errors.push(`Missing table configuration: ${tableName}`);
      }
    });
  } catch (error) {
    log.error(`Table verification failed: ${error.message}`);
    errors.push('Database configuration error');
  }
}

/**
 * Check 8: Verify Vercel configuration
 */
function checkVercelConfig() {
  console.log('\n⚡ Checking Vercel Configuration...');
  
  const vercelPath = path.join(__dirname, '..', 'vercel.json');
  
  if (fs.existsSync(vercelPath)) {
    try {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
      
      if (vercelConfig.version === 2) {
        log.success('Vercel config version is correct');
      } else {
        log.warning('Vercel config version may be outdated');
        warnings.push('Update vercel.json version to 2');
      }

      if (vercelConfig.builds) {
        log.success('Build configuration present');
      }

      if (vercelConfig.routes) {
        log.success('Route configuration present');
      }
    } catch (error) {
      log.error(`Invalid vercel.json: ${error.message}`);
      errors.push('Vercel configuration error');
    }
  } else {
    log.error('vercel.json not found');
    errors.push('Missing vercel.json');
  }
}

/**
 * Main execution
 */
async function runChecks() {
  try {
    checkRequiredFiles();
    checkDependencies();
    checkEnvironmentVariables();
    await testModuleImports();
    await verifyAWSCredentials();
    await testCacheUtility();
    verifyTableNames();
    checkVercelConfig();

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 VERIFICATION SUMMARY\n');

    if (errors.length === 0 && warnings.length === 0) {
      log.success('All checks passed! Backend is ready for deployment. 🎉');
      console.log('\n✨ Next steps:');
      console.log('   1. Run: npm install');
      console.log('   2. Setup tables: node scripts/setup-all-tables.js');
      console.log('   3. Deploy: npm run deploy');
      process.exit(0);
    } else {
      if (errors.length > 0) {
        console.log(`\n❌ Found ${errors.length} error(s):\n`);
        errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
      }

      if (warnings.length > 0) {
        console.log(`\n⚠️  Found ${warnings.length} warning(s):\n`);
        warnings.forEach((warn, i) => console.log(`   ${i + 1}. ${warn}`));
      }

      if (errors.length > 0) {
        console.log('\n❌ Backend is NOT ready for deployment. Fix errors above.');
        process.exit(1);
      } else {
        console.log('\n⚠️  Backend has warnings but can be deployed. Review warnings above.');
        process.exit(0);
      }
    }
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  }
}

// Run checks
runChecks();
