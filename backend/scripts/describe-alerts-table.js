/**
 * Describe Alerts Table
 * Get the actual table schema from DynamoDB
 */

require('dotenv').config();
const { DynamoDBClient, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const tableName = process.env.ALERTS_TABLE || 'iot-platform-alerts';

async function describeTable() {
  try {
    console.log(`🔍 Describing table "${tableName}"...\n`);
    
    const result = await client.send(new DescribeTableCommand({
      TableName: tableName
    }));

    const table = result.Table;

    console.log('Table Information:');
    console.log(`  Name: ${table.TableName}`);
    console.log(`  Status: ${table.TableStatus}`);
    console.log(`  Item count: ${table.ItemCount || 0}`);
    console.log(`  Size (bytes): ${table.TableSizeBytes || 0}`);
    console.log();

    console.log('Primary Key Schema:');
    table.KeySchema.forEach(key => {
      const attrDef = table.AttributeDefinitions.find(a => a.AttributeName === key.AttributeName);
      console.log(`  ${key.KeyType === 'HASH' ? 'Partition Key' : 'Sort Key'}: ${key.AttributeName} (${attrDef.AttributeType})`);
    });
    console.log();

    if (table.GlobalSecondaryIndexes && table.GlobalSecondaryIndexes.length > 0) {
      console.log('Global Secondary Indexes:');
      table.GlobalSecondaryIndexes.forEach(gsi => {
        console.log(`  ${gsi.IndexName}:`);
        gsi.KeySchema.forEach(key => {
          const attrDef = table.AttributeDefinitions.find(a => a.AttributeName === key.AttributeName);
          console.log(`    ${key.KeyType === 'HASH' ? 'Partition Key' : 'Sort Key'}: ${key.AttributeName} (${attrDef.AttributeType})`);
        });
      });
      console.log();
    }

    console.log('All Attribute Definitions:');
    table.AttributeDefinitions.forEach(attr => {
      console.log(`  ${attr.AttributeName}: ${attr.AttributeType}`);
    });

    // Check if partition key matches expected
    const partitionKey = table.KeySchema.find(k => k.KeyType === 'HASH');
    if (partitionKey.AttributeName === 'id') {
      console.log('\n⚠️  WARNING: Table uses "id" as partition key');
      console.log('   Backend code expects "alertId" as partition key');
      console.log('   This mismatch causes 500 errors!');
      console.log('\n   Options:');
      console.log('   1. Update backend code to use "id" instead of "alertId"');
      console.log('   2. Recreate table with "alertId" as partition key and migrate data');
    } else if (partitionKey.AttributeName === 'alertId') {
      console.log('\n✅ Partition key is "alertId" (correct)');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

describeTable()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
