/**
 * Migrate Alerts ID Field
 * Renames 'id' field to 'alertId' in all existing alerts
 */

require('dotenv').config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  DynamoDBDocumentClient, 
  ScanCommand, 
  PutCommand,
  DeleteCommand 
} = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const dynamodb = DynamoDBDocumentClient.from(client);
const tableName = process.env.ALERTS_TABLE || 'iot-platform-alerts';

async function migrateAlerts() {
  try {
    console.log(`🔍 Scanning table "${tableName}" for alerts with 'id' field...\n`);
    
    const scanResult = await dynamodb.send(new ScanCommand({
      TableName: tableName
    }));

    if (!scanResult.Items || scanResult.Items.length === 0) {
      console.log('⚠️  No alerts found in the table');
      return;
    }

    const alertsToMigrate = scanResult.Items.filter(alert => 
      'id' in alert && !('alertId' in alert)
    );

    if (alertsToMigrate.length === 0) {
      console.log('✅ No migration needed - all alerts already use "alertId" field');
      return;
    }

    console.log(`📝 Found ${alertsToMigrate.length} alert(s) to migrate\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const alert of alertsToMigrate) {
      try {
        console.log(`Migrating alert: ${alert.id}`);
        
        // Create new alert with alertId field
        const migratedAlert = {
          ...alert,
          alertId: alert.id // Rename id -> alertId
        };
        delete migratedAlert.id; // Remove old id field

        // Delete old alert (with 'id' as key)
        await dynamodb.send(new DeleteCommand({
          TableName: tableName,
          Key: { id: alert.id }
        }));

        // Put new alert (with 'alertId' as key)
        await dynamodb.send(new PutCommand({
          TableName: tableName,
          Item: migratedAlert
        }));

        console.log(`  ✅ Migrated successfully`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ Error migrating alert ${alert.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('Migration Summary:');
    console.log(`  Total alerts: ${alertsToMigrate.length}`);
    console.log(`  ✅ Success: ${successCount}`);
    console.log(`  ❌ Failed: ${errorCount}`);
    console.log('='.repeat(50));

    if (errorCount > 0) {
      throw new Error(`Migration completed with ${errorCount} error(s)`);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('All alerts now use "alertId" field as partition key.');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
migrateAlerts()
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed');
    process.exit(1);
  });
