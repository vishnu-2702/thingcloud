/**
 * Check Alerts Data
 * Inspect the actual structure of alerts in DynamoDB
 */

require('dotenv').config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const dynamodb = DynamoDBDocumentClient.from(client);
const tableName = process.env.ALERTS_TABLE || 'iot-platform-alerts';

async function checkAlertsData() {
  try {
    console.log(`🔍 Scanning table "${tableName}"...\n`);
    
    const result = await dynamodb.send(new ScanCommand({
      TableName: tableName,
      Limit: 10 // Just get a few records
    }));

    if (!result.Items || result.Items.length === 0) {
      console.log('⚠️  No alerts found in the table');
      return;
    }

    console.log(`✅ Found ${result.Items.length} alert(s)\n`);
    
    result.Items.forEach((alert, index) => {
      console.log(`Alert #${index + 1}:`);
      console.log(`  Keys in object:`, Object.keys(alert).join(', '));
      console.log(`  Has 'id' field:`, 'id' in alert);
      console.log(`  Has 'alertId' field:`, 'alertId' in alert);
      
      if ('id' in alert) {
        console.log(`  ⚠️  Found 'id' field: ${alert.id}`);
      }
      if ('alertId' in alert) {
        console.log(`  ✅ Found 'alertId' field: ${alert.alertId}`);
      }
      
      console.log(`  Message: ${alert.message}`);
      console.log(`  UserId: ${alert.userId}`);
      console.log(`  Created: ${alert.createdAt}`);
      console.log('');
    });

    // Check if we need to migrate
    const needsMigration = result.Items.some(alert => 'id' in alert && !('alertId' in alert));
    
    if (needsMigration) {
      console.log('\n⚠️  MIGRATION NEEDED!');
      console.log('Some alerts use "id" field instead of "alertId"');
      console.log('This will cause 500 errors when trying to mark as read or delete.');
      console.log('\nRun: node scripts/migrate-alerts-id-field.js');
    } else {
      console.log('\n✅ All alerts use correct "alertId" field');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

checkAlertsData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
