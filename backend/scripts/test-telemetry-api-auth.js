/**
 * Test Telemetry API with Real HTTP Request
 * Tests the actual API endpoint with authentication
 */

require('dotenv').config();
const http = require('http');

// API Configuration
const API_KEY = '17482860-8cc8-4b2e-a0a7-ff520da7a020';
const API_HOST = 'localhost';
const API_PORT = 3001;
const API_PATH = '/api/telemetry';

// Test data
const TELEMETRY_DATA = {
  data: {
    V0: 28,
    V1: 62
  }
};

console.log('\n🧪 Testing Telemetry API Endpoint with Authentication\n');
console.log('='.repeat(60));
console.log('\n📋 Configuration:');
console.log(`  API Key: ${API_KEY}`);
console.log(`  Endpoint: http://${API_HOST}:${API_PORT}${API_PATH}`);
console.log(`  Method: POST`);
console.log(`  Body:`, JSON.stringify(TELEMETRY_DATA, null, 2));
console.log('\n' + '='.repeat(60));

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testWithoutApiKey() {
  console.log('\n🔒 Test 1: Request WITHOUT API Key (Should Fail)');
  console.log('-'.repeat(60));
  
  try {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options, TELEMETRY_DATA);
    
    console.log(`  Status Code: ${response.statusCode}`);
    console.log(`  Response Body:`, response.body);
    
    if (response.statusCode === 401) {
      console.log('  ✅ Correctly rejected - Unauthorized');
      return true;
    } else {
      console.log('  ❌ Expected 401, got', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('  ❌ Request failed:', error.message);
    return false;
  }
}

async function testWithInvalidApiKey() {
  console.log('\n🔒 Test 2: Request with INVALID API Key (Should Fail)');
  console.log('-'.repeat(60));
  
  try {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'invalid-key-12345'
      }
    };
    
    const response = await makeRequest(options, TELEMETRY_DATA);
    
    console.log(`  Status Code: ${response.statusCode}`);
    console.log(`  Response Body:`, response.body);
    
    if (response.statusCode === 401) {
      console.log('  ✅ Correctly rejected - Invalid API Key');
      return true;
    } else {
      console.log('  ❌ Expected 401, got', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('  ❌ Request failed:', error.message);
    return false;
  }
}

async function testWithValidApiKey() {
  console.log('\n🔓 Test 3: Request with VALID API Key (Should Succeed)');
  console.log('-'.repeat(60));
  
  try {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    };
    
    const response = await makeRequest(options, TELEMETRY_DATA);
    
    console.log(`  Status Code: ${response.statusCode}`);
    console.log(`  Response Body:`, response.body);
    
    if (response.statusCode === 201) {
      try {
        const parsedResponse = JSON.parse(response.body);
        console.log('  ✅ Telemetry accepted!');
        console.log(`  Telemetry ID: ${parsedResponse.data?.telemetryId || 'N/A'}`);
        console.log(`  Message: ${parsedResponse.message || 'N/A'}`);
        return true;
      } catch (parseError) {
        console.log('  ⚠️  Response not JSON:', response.body);
        return response.statusCode === 201;
      }
    } else {
      console.log('  ❌ Expected 201, got', response.statusCode);
      return false;
    }
  } catch (error) {
    console.log('  ❌ Request failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('  ⚠️  Is the server running on port 3001?');
    }
    return false;
  }
}

async function testWithMultipleRequests() {
  console.log('\n📊 Test 4: Multiple Telemetry Requests');
  console.log('-'.repeat(60));
  
  let successCount = 0;
  const totalRequests = 3;
  
  for (let i = 1; i <= totalRequests; i++) {
    try {
      const testData = {
        data: {
          V0: 20 + i * 2,
          V1: 55 + i * 3
        }
      };
      
      const options = {
        hostname: API_HOST,
        port: API_PORT,
        path: API_PATH,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        }
      };
      
      console.log(`  Request ${i}/${totalRequests}: V0=${testData.data.V0}, V1=${testData.data.V1}`);
      const response = await makeRequest(options, testData);
      
      if (response.statusCode === 201) {
        successCount++;
        console.log(`    ✅ Success (${response.statusCode})`);
      } else {
        console.log(`    ❌ Failed (${response.statusCode})`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.log(`    ❌ Error:`, error.message);
    }
  }
  
  console.log(`\n  Summary: ${successCount}/${totalRequests} requests succeeded`);
  return successCount === totalRequests;
}

async function runAllTests() {
  console.log('\n🚀 Starting API Authentication Tests...\n');
  
  const results = {
    withoutApiKey: false,
    withInvalidApiKey: false,
    withValidApiKey: false,
    multipleRequests: false
  };
  
  // Check if server is reachable
  try {
    const healthCheck = await makeRequest({
      hostname: API_HOST,
      port: API_PORT,
      path: '/health',
      method: 'GET'
    });
    console.log(`\n✅ Server is running (Status: ${healthCheck.statusCode})`);
  } catch (error) {
    console.error('\n❌ Server is not reachable!');
    console.error('   Please start the backend server first:');
    console.error('   cd backend && npm start');
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  }
  
  // Run tests
  results.withoutApiKey = await testWithoutApiKey();
  results.withInvalidApiKey = await testWithInvalidApiKey();
  results.withValidApiKey = await testWithValidApiKey();
  
  // Only test multiple requests if valid key test passed
  if (results.withValidApiKey) {
    results.multipleRequests = await testWithMultipleRequests();
  } else {
    console.log('\n⚠️  Skipping multiple requests test (valid API key test failed)');
    results.multipleRequests = false;
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
    console.log('\n✅ ALL TESTS PASSED! API authentication is working correctly.\n');
    process.exit(0);
  } else {
    console.log(`\n❌ ${total - passed} TEST(S) FAILED!\n`);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Fatal error running tests:', error);
  process.exit(1);
});
