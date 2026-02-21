// ============================================================================
// DEBUG: Widget Data Flow Investigation
// ============================================================================
// Tests the relationship between telemetry data keys and widget dataKey configs
// to diagnose why widgets aren't displaying telemetry data

require('dotenv').config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
const docClient = DynamoDBDocumentClient.from(client);

const TABLES = {
  DEVICES: process.env.DEVICES_TABLE || 'iot-platform-devices',
  TELEMETRY: process.env.TELEMETRY_TABLE || 'iot-platform-telemetry',
  TEMPLATES: process.env.TEMPLATES_TABLE || 'iot-platform-templates',
  DASHBOARDS: process.env.DASHBOARD_LAYOUTS_TABLE || 'iot-platform-dashboard-layouts'
};

async function debugWidgetData() {
  console.log('\n🔍 DEBUGGING WIDGET DATA FLOW\n');
  console.log('='.repeat(80));

  try {
    // 1. Get a device with the test API key
    console.log('\n1️⃣  DEVICE LOOKUP');
    console.log('-'.repeat(80));
    
    const deviceQuery = await docClient.send(new QueryCommand({
      TableName: TABLES.DEVICES,
      IndexName: 'ApiKeyIndex',
      KeyConditionExpression: 'apiKey = :apiKey',
      ExpressionAttributeValues: {
        ':apiKey': '17482860-8cc8-4b2e-a0a7-ff520da7a020'
      }
    }));

    if (!deviceQuery.Items || deviceQuery.Items.length === 0) {
      console.log('❌ No device found with API key');
      return;
    }

    const device = deviceQuery.Items[0];
    console.log(`✅ Device Found: ${device.name} (${device.deviceId})`);
    console.log(`   Template ID: ${device.templateId || 'None'}`);

    // 2. Get template and datastreams
    if (device.templateId) {
      console.log('\n2️⃣  TEMPLATE & DATASTREAMS');
      console.log('-'.repeat(80));
      
      const templateResult = await docClient.send(new GetCommand({
        TableName: TABLES.TEMPLATES,
        Key: { templateId: device.templateId }
      }));

      if (templateResult.Item) {
        const template = templateResult.Item;
        console.log(`✅ Template: ${template.name}`);
        console.log(`   Datastreams: ${template.datastreams?.length || 0}`);
        
        if (template.datastreams && template.datastreams.length > 0) {
          console.log('\n   Datastream Configuration:');
          template.datastreams.forEach((ds, i) => {
            console.log(`   ${i + 1}. Name: "${ds.name}"`);
            console.log(`      Pin: ${ds.pin || 'N/A'}`);
            console.log(`      Virtual Pin: ${ds.virtualPin || 'N/A'}`);
            console.log(`      Type: ${ds.dataType || 'N/A'}`);
            console.log(`      Key Used (virtualPin || pin): ${ds.virtualPin || ds.pin}`);
            console.log('');
          });
        }
      } else {
        console.log('❌ Template not found');
      }
    }

    // 3. Get recent telemetry data
    console.log('\n3️⃣  TELEMETRY DATA');
    console.log('-'.repeat(80));
    
    const telemetryQuery = await docClient.send(new QueryCommand({
      TableName: TABLES.TELEMETRY,
      IndexName: 'DeviceIdIndex',
      KeyConditionExpression: 'deviceId = :deviceId',
      ExpressionAttributeValues: {
        ':deviceId': device.deviceId
      },
      ScanIndexForward: false,
      Limit: 5
    }));

    if (telemetryQuery.Items && telemetryQuery.Items.length > 0) {
      console.log(`✅ Found ${telemetryQuery.Items.length} telemetry records`);
      
      telemetryQuery.Items.forEach((item, i) => {
        console.log(`\n   Record ${i + 1}:`);
        console.log(`   Timestamp: ${item.timestamp}`);
        console.log(`   Data Structure: ${JSON.stringify(item.data, null, 2)}`);
        console.log(`   Data Keys: [${Object.keys(item.data || {}).join(', ')}]`);
      });

      // Check for key mismatches
      console.log('\n4️⃣  KEY MISMATCH ANALYSIS');
      console.log('-'.repeat(80));
      
      const telemetryKeys = Object.keys(telemetryQuery.Items[0].data || {});
      console.log(`   Telemetry Data Keys: [${telemetryKeys.join(', ')}]`);
      
      if (device.templateId) {
        const templateResult = await docClient.send(new GetCommand({
          TableName: TABLES.TEMPLATES,
          Key: { templateId: device.templateId }
        }));

        if (templateResult.Item?.datastreams) {
          const datastreamKeys = templateResult.Item.datastreams.map(ds => ds.virtualPin || ds.pin);
          console.log(`   Widget DataKey Values: [${datastreamKeys.join(', ')}]`);
          
          // Check for mismatches
          const mismatches = [];
          datastreamKeys.forEach(key => {
            if (!telemetryKeys.includes(key)) {
              mismatches.push(key);
            }
          });

          if (mismatches.length > 0) {
            console.log(`\n   ⚠️  MISMATCH DETECTED!`);
            console.log(`   Widget keys not found in telemetry data: [${mismatches.join(', ')}]`);
            console.log(`\n   💡 FIX: Ensure telemetry data uses the same keys as datastream pins`);
          } else {
            console.log(`\n   ✅ All widget keys match telemetry data keys`);
          }
        }
      }

    } else {
      console.log('❌ No telemetry data found');
    }

    // 5. Get dashboard configuration
    console.log('\n5️⃣  DASHBOARD CONFIGURATION');
    console.log('-'.repeat(80));
    
    const dashboardQuery = await docClient.send(new QueryCommand({
      TableName: TABLES.DASHBOARDS,
      KeyConditionExpression: 'deviceId = :deviceId',
      ExpressionAttributeValues: {
        ':deviceId': device.deviceId
      }
    }));

    if (dashboardQuery.Items && dashboardQuery.Items.length > 0) {
      const dashboard = dashboardQuery.Items[0];
      console.log(`✅ Dashboard found with ${dashboard.widgets?.length || 0} widgets`);
      
      if (dashboard.widgets && dashboard.widgets.length > 0) {
        console.log('\n   Widget Configurations:');
        dashboard.widgets.forEach((w, i) => {
          console.log(`   ${i + 1}. Type: ${w.type}`);
          console.log(`      Title: ${w.title}`);
          console.log(`      DataKey: "${w.dataKey}"`);
          console.log('');
        });
      }
    } else {
      console.log('⚠️  No dashboard configuration found');
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ DEBUG COMPLETE\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

debugWidgetData();
