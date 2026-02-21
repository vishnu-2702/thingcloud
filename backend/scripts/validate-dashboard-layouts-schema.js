/**
 * Validate Dashboard Layouts Schema
 * Comprehensive validation and repair for the iot-platform-dashboard-layouts table
 * 
 * Features:
 * - Validates table structure (keys, GSIs)
 * - Validates existing data integrity
 * - Repairs invalid widget positions
 * - Reports schema inconsistencies
 * - Optionally fixes data issues
 */

require('dotenv').config();
const { DynamoDBClient, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const dynamodb = DynamoDBDocumentClient.from(client);
const tableName = process.env.DASHBOARD_LAYOUTS_TABLE || 'iot-platform-dashboard-layouts';

// Expected schema definition
const EXPECTED_SCHEMA = {
  tableName: tableName,
  keySchema: {
    partitionKey: { name: 'deviceId', type: 'S' }
  },
  gsi: {
    UserIdIndex: {
      partitionKey: { name: 'userId', type: 'S' }
    }
  },
  requiredAttributes: ['deviceId', 'userId', 'widgets', 'gridCols', 'rowHeight', 'createdAt', 'updatedAt'],
  widgetSchema: {
    required: ['id', 'type', 'position'],
    position: {
      required: ['x', 'y', 'w', 'h'],
      types: {
        x: 'number',
        y: 'number', 
        w: 'number',
        h: 'number'
      },
      constraints: {
        x: { min: 0, max: 11 },
        y: { min: 0 },
        w: { min: 1, max: 12 },
        h: { min: 1, max: 10 }
      }
    },
    validTypes: [
      'label', 'value', 'gauge', 'radialGauge', 'status', 'switch', 
      'slider', 'progress', 'sparkline', 'bar', 'table', 'terminal',
      // Legacy types
      'valueCard', 'lineChart', 'chart', 'statusIndicator', 'barChart', 'areaChart'
    ]
  }
};

// Validation results tracker
const results = {
  tableStructure: { valid: true, issues: [] },
  dataIntegrity: { valid: true, issues: [], records: 0, widgets: 0 },
  positionIssues: [],
  fixableIssues: [],
  summary: {}
};

/**
 * Validate table structure
 */
async function validateTableStructure() {
  console.log('\n📋 Validating Table Structure...\n');
  
  try {
    const describeResult = await client.send(new DescribeTableCommand({ TableName: tableName }));
    const table = describeResult.Table;
    
    console.log(`  Table Name: ${table.TableName}`);
    console.log(`  Status: ${table.TableStatus}`);
    console.log(`  Item Count: ${table.ItemCount || 0}`);
    console.log(`  Size: ${(table.TableSizeBytes / 1024).toFixed(2)} KB`);
    
    // Check partition key
    const partitionKey = table.KeySchema.find(k => k.KeyType === 'HASH');
    if (partitionKey?.AttributeName !== EXPECTED_SCHEMA.keySchema.partitionKey.name) {
      results.tableStructure.valid = false;
      results.tableStructure.issues.push(
        `Partition key mismatch: expected '${EXPECTED_SCHEMA.keySchema.partitionKey.name}', found '${partitionKey?.AttributeName}'`
      );
    } else {
      console.log(`  ✅ Partition Key: ${partitionKey.AttributeName}`);
    }
    
    // Check GSI
    const userIdIndex = table.GlobalSecondaryIndexes?.find(gsi => gsi.IndexName === 'UserIdIndex');
    if (!userIdIndex) {
      results.tableStructure.valid = false;
      results.tableStructure.issues.push('Missing GSI: UserIdIndex');
    } else {
      const gsiPartitionKey = userIdIndex.KeySchema.find(k => k.KeyType === 'HASH');
      if (gsiPartitionKey?.AttributeName !== 'userId') {
        results.tableStructure.valid = false;
        results.tableStructure.issues.push(`UserIdIndex partition key mismatch: expected 'userId', found '${gsiPartitionKey?.AttributeName}'`);
      } else {
        console.log(`  ✅ GSI UserIdIndex: ${gsiPartitionKey.AttributeName} (${userIdIndex.IndexStatus})`);
      }
    }
    
    // Check attribute definitions
    const attrDefs = table.AttributeDefinitions;
    const expectedAttrs = ['deviceId', 'userId'];
    expectedAttrs.forEach(attr => {
      const found = attrDefs.find(a => a.AttributeName === attr);
      if (!found) {
        results.tableStructure.issues.push(`Missing attribute definition: ${attr}`);
      } else if (found.AttributeType !== 'S') {
        results.tableStructure.issues.push(`Attribute ${attr} should be type 'S', found '${found.AttributeType}'`);
      }
    });
    
    if (results.tableStructure.issues.length === 0) {
      console.log('\n  ✅ Table structure is valid!\n');
    } else {
      console.log('\n  ❌ Table structure issues found:\n');
      results.tableStructure.issues.forEach(issue => console.log(`     - ${issue}`));
    }
    
    return results.tableStructure.valid;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      results.tableStructure.valid = false;
      results.tableStructure.issues.push(`Table '${tableName}' does not exist`);
      console.log(`\n  ❌ Table '${tableName}' not found!\n`);
      return false;
    }
    throw error;
  }
}

/**
 * Validate a single widget
 */
function validateWidget(widget, index, deviceId) {
  const issues = [];
  
  // Check required fields
  if (!widget.id) {
    issues.push({ field: 'id', message: 'Missing widget id', fixable: true });
  }
  
  if (!widget.type) {
    issues.push({ field: 'type', message: 'Missing widget type', fixable: true });
  } else if (!EXPECTED_SCHEMA.widgetSchema.validTypes.includes(widget.type)) {
    issues.push({ field: 'type', message: `Unknown widget type: ${widget.type}`, fixable: false });
  }
  
  // Check position
  if (!widget.position) {
    issues.push({ field: 'position', message: 'Missing position object', fixable: true });
  } else {
    const pos = widget.position;
    const constraints = EXPECTED_SCHEMA.widgetSchema.position.constraints;
    
    // Check each position field
    ['x', 'y', 'w', 'h'].forEach(field => {
      const value = pos[field];
      
      if (value === undefined || value === null) {
        issues.push({ field: `position.${field}`, message: `Missing ${field}`, fixable: true });
      } else if (typeof value !== 'number') {
        issues.push({ 
          field: `position.${field}`, 
          message: `${field} should be number, got ${typeof value} (${value})`, 
          fixable: true,
          currentValue: value
        });
      } else if (constraints[field]) {
        if (constraints[field].min !== undefined && value < constraints[field].min) {
          issues.push({ 
            field: `position.${field}`, 
            message: `${field}=${value} is below minimum ${constraints[field].min}`, 
            fixable: true,
            currentValue: value
          });
        }
        if (constraints[field].max !== undefined && value > constraints[field].max) {
          issues.push({ 
            field: `position.${field}`, 
            message: `${field}=${value} exceeds maximum ${constraints[field].max}`, 
            fixable: true,
            currentValue: value
          });
        }
      }
    });
  }
  
  return {
    widgetId: widget.id || `widget-${index}`,
    deviceId,
    issues,
    isValid: issues.length === 0
  };
}

/**
 * Validate all data in the table
 */
async function validateData(collectData = false) {
  console.log('\n📊 Validating Data Integrity...\n');
  
  let lastEvaluatedKey;
  let totalRecords = 0;
  let totalWidgets = 0;
  let invalidRecords = 0;
  let invalidWidgets = 0;
  const allData = [];
  
  do {
    const scanResult = await dynamodb.send(new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey: lastEvaluatedKey
    }));
    
    for (const item of scanResult.Items || []) {
      totalRecords++;
      const recordIssues = [];
      
      if (collectData) {
        allData.push(item);
      }
      
      // Check required attributes
      EXPECTED_SCHEMA.requiredAttributes.forEach(attr => {
        if (item[attr] === undefined) {
          recordIssues.push(`Missing required attribute: ${attr}`);
        }
      });
      
      // Validate widgets array
      if (!Array.isArray(item.widgets)) {
        recordIssues.push('widgets is not an array');
      } else {
        item.widgets.forEach((widget, idx) => {
          totalWidgets++;
          const validation = validateWidget(widget, idx, item.deviceId);
          
          if (!validation.isValid) {
            invalidWidgets++;
            validation.issues.forEach(issue => {
              results.positionIssues.push({
                deviceId: item.deviceId,
                widgetId: validation.widgetId,
                ...issue
              });
              
              if (issue.fixable) {
                results.fixableIssues.push({
                  deviceId: item.deviceId,
                  widgetId: validation.widgetId,
                  widgetIndex: idx,
                  ...issue
                });
              }
            });
          }
        });
      }
      
      // Check grid settings
      if (typeof item.gridCols !== 'number') {
        recordIssues.push(`gridCols should be number, got ${typeof item.gridCols}`);
      }
      if (typeof item.rowHeight !== 'number') {
        recordIssues.push(`rowHeight should be number, got ${typeof item.rowHeight}`);
      }
      
      if (recordIssues.length > 0) {
        invalidRecords++;
        results.dataIntegrity.issues.push({
          deviceId: item.deviceId,
          issues: recordIssues
        });
      }
    }
    
    lastEvaluatedKey = scanResult.LastEvaluatedKey;
  } while (lastEvaluatedKey);
  
  results.dataIntegrity.records = totalRecords;
  results.dataIntegrity.widgets = totalWidgets;
  results.dataIntegrity.invalidRecords = invalidRecords;
  results.dataIntegrity.invalidWidgets = invalidWidgets;
  results.dataIntegrity.valid = invalidRecords === 0 && invalidWidgets === 0;
  
  console.log(`  Total Records: ${totalRecords}`);
  console.log(`  Total Widgets: ${totalWidgets}`);
  console.log(`  Invalid Records: ${invalidRecords}`);
  console.log(`  Invalid Widgets: ${invalidWidgets}`);
  console.log(`  Fixable Issues: ${results.fixableIssues.length}`);
  
  if (results.dataIntegrity.valid) {
    console.log('\n  ✅ All data is valid!\n');
  } else {
    console.log('\n  ⚠️  Data integrity issues found\n');
  }
  
  return allData;
}

/**
 * Fix widget position issues
 */
function fixWidgetPosition(widget, idx) {
  const pos = widget.position || {};
  const widgetDefaults = {
    x: (idx * 3) % 12,
    y: Math.floor(idx / 4) * 2,
    w: 3,
    h: 2
  };
  
  // Ensure position is an object
  widget.position = {
    x: parsePositionValue(pos.x, widgetDefaults.x, 0, 11),
    y: parsePositionValue(pos.y, widgetDefaults.y, 0, 100),
    w: parsePositionValue(pos.w, widgetDefaults.w, 1, 12),
    h: parsePositionValue(pos.h, widgetDefaults.h, 1, 10)
  };
  
  // Ensure widget has required fields
  if (!widget.id) {
    widget.id = `widget-${Date.now()}-${idx}`;
  }
  if (!widget.type) {
    widget.type = 'label';
  }
  
  return widget;
}

/**
 * Parse and constrain position value
 */
function parsePositionValue(value, defaultVal, min, max) {
  let parsed;
  
  if (typeof value === 'number' && Number.isFinite(value)) {
    parsed = value;
  } else if (typeof value === 'string') {
    parsed = parseInt(value, 10);
    if (isNaN(parsed)) parsed = defaultVal;
  } else {
    parsed = defaultVal;
  }
  
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

/**
 * Apply fixes to data
 */
async function applyFixes() {
  console.log('\n🔧 Applying Fixes...\n');
  
  if (results.fixableIssues.length === 0) {
    console.log('  No fixes needed!\n');
    return;
  }
  
  // Group issues by deviceId
  const deviceIssues = {};
  results.fixableIssues.forEach(issue => {
    if (!deviceIssues[issue.deviceId]) {
      deviceIssues[issue.deviceId] = [];
    }
    deviceIssues[issue.deviceId].push(issue);
  });
  
  let fixedRecords = 0;
  let fixedWidgets = 0;
  
  for (const deviceId of Object.keys(deviceIssues)) {
    try {
      // Get current record
      const result = await dynamodb.send(new GetCommand({
        TableName: tableName,
        Key: { deviceId }
      }));
      
      if (!result.Item) continue;
      
      const record = result.Item;
      let modified = false;
      
      // Fix widgets
      if (Array.isArray(record.widgets)) {
        record.widgets = record.widgets.map((widget, idx) => {
          const fixedWidget = fixWidgetPosition(widget, idx);
          if (JSON.stringify(widget) !== JSON.stringify(fixedWidget)) {
            modified = true;
            fixedWidgets++;
          }
          return fixedWidget;
        });
      }
      
      // Fix grid settings
      if (typeof record.gridCols !== 'number') {
        record.gridCols = 12;
        modified = true;
      }
      if (typeof record.rowHeight !== 'number') {
        record.rowHeight = 60;
        modified = true;
      }
      
      // Update timestamp
      if (modified) {
        record.updatedAt = new Date().toISOString();
        
        await dynamodb.send(new PutCommand({
          TableName: tableName,
          Item: record
        }));
        
        fixedRecords++;
        console.log(`  ✅ Fixed record: ${deviceId}`);
      }
    } catch (error) {
      console.error(`  ❌ Error fixing ${deviceId}:`, error.message);
    }
  }
  
  console.log(`\n  Fixed ${fixedRecords} records, ${fixedWidgets} widgets\n`);
}

/**
 * Print summary report
 */
function printSummary(showData = false, data = []) {
  console.log('\n' + '='.repeat(60));
  console.log('📋 VALIDATION SUMMARY');
  console.log('='.repeat(60));
  
  console.log('\n📁 Table Structure:');
  console.log(`   Status: ${results.tableStructure.valid ? '✅ Valid' : '❌ Invalid'}`);
  if (results.tableStructure.issues.length > 0) {
    results.tableStructure.issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  console.log('\n📊 Data Integrity:');
  console.log(`   Records Scanned: ${results.dataIntegrity.records}`);
  console.log(`   Widgets Scanned: ${results.dataIntegrity.widgets}`);
  console.log(`   Invalid Records: ${results.dataIntegrity.invalidRecords}`);
  console.log(`   Invalid Widgets: ${results.dataIntegrity.invalidWidgets}`);
  console.log(`   Status: ${results.dataIntegrity.valid ? '✅ Valid' : '⚠️  Issues Found'}`);
  
  if (results.positionIssues.length > 0 && results.positionIssues.length <= 20) {
    console.log('\n🔍 Position Issues:');
    results.positionIssues.forEach(issue => {
      console.log(`   Device: ${issue.deviceId}`);
      console.log(`   Widget: ${issue.widgetId}`);
      console.log(`   Field: ${issue.field}`);
      console.log(`   Issue: ${issue.message}`);
      console.log(`   Fixable: ${issue.fixable ? 'Yes' : 'No'}`);
      console.log('');
    });
  } else if (results.positionIssues.length > 20) {
    console.log(`\n🔍 Position Issues: ${results.positionIssues.length} (too many to display)`);
  }
  
  // Show data if requested
  if (showData && data.length > 0) {
    console.log('\n📄 Current Data:');
    console.log('-'.repeat(60));
    data.forEach(record => {
      console.log(`\n  Device: ${record.deviceId}`);
      console.log(`  User: ${record.userId}`);
      console.log(`  Name: ${record.name || 'N/A'}`);
      console.log(`  Grid: ${record.gridCols} cols × ${record.rowHeight}px rows`);
      console.log(`  Widgets (${record.widgets?.length || 0}):`);
      (record.widgets || []).forEach((w, i) => {
        const pos = w.position || {};
        console.log(`    ${i + 1}. ${w.type} [${w.id}]`);
        console.log(`       Position: x=${pos.x}, y=${pos.y}, w=${pos.w}, h=${pos.h}`);
        console.log(`       DataKey: ${w.dataKey || 'none'}`);
        console.log(`       Title: ${w.title || w.config?.label || 'Untitled'}`);
      });
    });
  }
  
  console.log('\n' + '='.repeat(60));
}

/**
 * Main validation function
 */
async function validateDashboardLayouts(options = {}) {
  const { fix = false, showData = false } = options;
  
  console.log('🔍 Dashboard Layouts Schema Validator');
  console.log('='.repeat(60));
  console.log(`Table: ${tableName}`);
  console.log(`Mode: ${fix ? 'Validate & Fix' : 'Validate Only'}${showData ? ' + Show Data' : ''}`);
  
  let collectedData = [];
  
  try {
    // Step 1: Validate table structure
    const structureValid = await validateTableStructure();
    
    if (!structureValid) {
      console.log('\n⚠️  Table structure is invalid. Cannot validate data.');
      printSummary(false, []);
      return results;
    }
    
    // Step 2: Validate data
    collectedData = await validateData(showData);
    
    // Step 3: Apply fixes if requested
    if (fix && results.fixableIssues.length > 0) {
      await applyFixes();
      
      // Re-validate after fixes
      results.positionIssues = [];
      results.fixableIssues = [];
      collectedData = await validateData(showData);
    }
    
    // Step 4: Print summary
    printSummary(showData, collectedData);
    
    return results;
  } catch (error) {
    console.error('\n❌ Validation failed:', error.message);
    throw error;
  }
}

// CLI interface
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix') || args.includes('-f');
const shouldShowData = args.includes('--show') || args.includes('-s');

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Dashboard Layouts Schema Validator

Usage:
  node validate-dashboard-layouts-schema.js [options]

Options:
  --fix, -f     Apply automatic fixes to invalid data
  --show, -s    Show current data in the table
  --help, -h    Show this help message

Examples:
  node validate-dashboard-layouts-schema.js              # Validate only
  node validate-dashboard-layouts-schema.js --fix        # Validate and fix
  node validate-dashboard-layouts-schema.js --show       # Validate and show data
  node validate-dashboard-layouts-schema.js --fix --show # Fix and show results
`);
  process.exit(0);
}

validateDashboardLayouts({ fix: shouldFix, showData: shouldShowData })
  .then(results => {
    const hasIssues = !results.tableStructure.valid || !results.dataIntegrity.valid;
    process.exit(hasIssues ? 1 : 0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
