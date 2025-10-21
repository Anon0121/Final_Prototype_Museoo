/**
 * Database Structure Verification Script
 * Run this to verify your database matches the expected structure
 * 
 * Usage: node verify-database-structure.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}\n${colors.blue}${msg}${colors.reset}\n${colors.blue}${'='.repeat(60)}${colors.reset}\n`)
};

// Expected tables in your database
const EXPECTED_TABLES = [
  'activities',
  'additional_visitors',
  'ai_insights', // Note: might be ai_insight (singular)
  'archives',
  'bookings',
  'cultural_objects',
  'donation_city_hall_submission',
  'donation_details',
  'donation_documents',
  'donation_meeting_schedule',
  'donation_visitor_submissions',
  'donation_workflow_log',
  'donations',
  'event_details',
  'event_registrations',
  'exhibit_details',
  'images',
  'object_details', // Note: you listed as oobject_details
  'promotional_items', // Note: might be promotional_item (singular)
  'reports',
  'system_user',
  'user_activity_logs',
  'user_permissions',
  'visitors'
];

// Maintenance fields that should exist in object_details
const MAINTENANCE_FIELDS = [
  'last_maintenance_date',
  'next_maintenance_date',
  'maintenance_frequency_months',
  'maintenance_notes',
  'maintenance_priority',
  'maintenance_status',
  'maintenance_reminder_enabled',
  'maintenance_contact',
  'maintenance_cost'
];

// Expected indexes
const MAINTENANCE_INDEXES = [
  'idx_next_maintenance_date',
  'idx_maintenance_status'
];

async function verifyDatabase() {
  let connection;
  
  try {
    log.title('DATABASE STRUCTURE VERIFICATION');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'museosmart'
    });
    
    log.success(`Connected to database: ${process.env.DB_NAME || 'museosmart'}`);
    
    // ==========================================
    // 1. CHECK ALL TABLES EXIST
    // ==========================================
    log.title('1. CHECKING ALL TABLES');
    
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    log.info(`Found ${tableNames.length} tables in database`);
    
    let missingTables = [];
    let foundTables = [];
    
    for (const expectedTable of EXPECTED_TABLES) {
      if (tableNames.includes(expectedTable)) {
        log.success(`Table '${expectedTable}' exists`);
        foundTables.push(expectedTable);
      } else {
        // Check for variations
        const variations = tableNames.filter(t => 
          t.toLowerCase().includes(expectedTable.toLowerCase()) ||
          expectedTable.toLowerCase().includes(t.toLowerCase())
        );
        
        if (variations.length > 0) {
          log.warning(`Table '${expectedTable}' not found, but found similar: ${variations.join(', ')}`);
        } else {
          log.error(`Table '${expectedTable}' is MISSING`);
          missingTables.push(expectedTable);
        }
      }
    }
    
    // Check for extra tables
    const extraTables = tableNames.filter(t => !EXPECTED_TABLES.includes(t));
    if (extraTables.length > 0) {
      log.info(`Additional tables found: ${extraTables.join(', ')}`);
    }
    
    // ==========================================
    // 2. VERIFY CULTURAL OBJECTS TABLES
    // ==========================================
    log.title('2. VERIFYING CULTURAL OBJECTS MODULE');
    
    // Check cultural_objects table
    if (tableNames.includes('cultural_objects')) {
      log.success('cultural_objects table exists');
      
      const [coColumns] = await connection.query('DESCRIBE cultural_objects');
      const coFields = coColumns.map(c => c.Field);
      
      const requiredFields = ['id', 'name', 'category', 'description', 'created_at'];
      for (const field of requiredFields) {
        if (coFields.includes(field)) {
          log.success(`  ✓ Field '${field}' exists`);
        } else {
          log.error(`  ✗ Field '${field}' is MISSING`);
        }
      }
    } else {
      log.error('cultural_objects table is MISSING - THIS IS CRITICAL!');
    }
    
    // Check object_details table (or oobject_details)
    let objectDetailsTable = null;
    if (tableNames.includes('object_details')) {
      objectDetailsTable = 'object_details';
      log.success('object_details table exists');
    } else if (tableNames.includes('oobject_details')) {
      objectDetailsTable = 'oobject_details';
      log.warning('Found "oobject_details" (with double-o) - this might be a typo!');
    } else {
      log.error('object_details table is MISSING - THIS IS CRITICAL!');
    }
    
    // ==========================================
    // 3. VERIFY MAINTENANCE FIELDS
    // ==========================================
    if (objectDetailsTable) {
      log.title('3. VERIFYING MAINTENANCE FIELDS');
      
      const [odColumns] = await connection.query(`DESCRIBE ${objectDetailsTable}`);
      const odFields = odColumns.map(c => c.Field);
      
      let maintenanceFieldsFound = 0;
      for (const field of MAINTENANCE_FIELDS) {
        if (odFields.includes(field)) {
          const fieldInfo = odColumns.find(c => c.Field === field);
          log.success(`  ✓ ${field} (${fieldInfo.Type})`);
          maintenanceFieldsFound++;
        } else {
          log.error(`  ✗ ${field} is MISSING`);
        }
      }
      
      if (maintenanceFieldsFound === MAINTENANCE_FIELDS.length) {
        log.success(`All ${MAINTENANCE_FIELDS.length} maintenance fields are present!`);
      } else if (maintenanceFieldsFound === 0) {
        log.error('NO MAINTENANCE FIELDS FOUND - Migration not run!');
        log.warning('Run: node backend/scripts/add_maintenance_reminders.js');
      } else {
        log.warning(`Only ${maintenanceFieldsFound}/${MAINTENANCE_FIELDS.length} maintenance fields found`);
      }
    } else {
      log.error('Cannot verify maintenance fields - object_details table not found');
    }
    
    // ==========================================
    // 4. VERIFY INDEXES
    // ==========================================
    if (objectDetailsTable) {
      log.title('4. VERIFYING INDEXES');
      
      const [indexes] = await connection.query(`SHOW INDEX FROM ${objectDetailsTable}`);
      const indexNames = [...new Set(indexes.map(i => i.Key_name))];
      
      for (const expectedIndex of MAINTENANCE_INDEXES) {
        if (indexNames.includes(expectedIndex)) {
          log.success(`Index '${expectedIndex}' exists`);
        } else {
          log.warning(`Index '${expectedIndex}' is MISSING - Performance may be affected`);
        }
      }
    }
    
    // ==========================================
    // 5. CHECK MAINTENANCE VIEW
    // ==========================================
    log.title('5. CHECKING DATABASE VIEWS');
    
    const [views] = await connection.query(
      "SHOW FULL TABLES WHERE Table_type = 'VIEW'"
    );
    
    if (views.length > 0) {
      const viewNames = views.map(v => Object.values(v)[0]);
      log.info(`Found ${viewNames.length} view(s): ${viewNames.join(', ')}`);
      
      if (viewNames.includes('maintenance_overview')) {
        log.success('maintenance_overview view exists');
        
        // Test the view
        try {
          const [testQuery] = await connection.query(
            'SELECT COUNT(*) as count FROM maintenance_overview'
          );
          log.success(`View is queryable (${testQuery[0].count} objects with maintenance tracking)`);
        } catch (err) {
          log.error(`View exists but cannot be queried: ${err.message}`);
        }
      } else {
        log.warning('maintenance_overview view is MISSING');
      }
    } else {
      log.warning('No database views found - maintenance_overview is MISSING');
    }
    
    // ==========================================
    // 6. VERIFY FOREIGN KEYS
    // ==========================================
    log.title('6. VERIFYING FOREIGN KEY RELATIONSHIPS');
    
    const [foreignKeys] = await connection.query(`
      SELECT 
        TABLE_NAME, COLUMN_NAME, 
        CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE REFERENCED_TABLE_NAME IS NOT NULL
        AND TABLE_SCHEMA = '${process.env.DB_NAME || 'museosmart'}'
      ORDER BY TABLE_NAME, COLUMN_NAME
    `);
    
    log.info(`Found ${foreignKeys.length} foreign key relationships`);
    
    // Check critical foreign keys
    const criticalFKs = [
      { table: objectDetailsTable || 'object_details', column: 'cultural_object_id', references: 'cultural_objects' },
      { table: 'images', column: 'cultural_object_id', references: 'cultural_objects' },
      { table: 'user_permissions', column: 'user_id', references: 'system_user' }
    ];
    
    for (const fk of criticalFKs) {
      const exists = foreignKeys.find(
        key => key.TABLE_NAME === fk.table && 
               key.COLUMN_NAME === fk.column && 
               key.REFERENCED_TABLE_NAME === fk.references
      );
      
      if (exists) {
        log.success(`FK: ${fk.table}.${fk.column} → ${fk.references}`);
      } else {
        if (tableNames.includes(fk.table)) {
          log.warning(`FK missing: ${fk.table}.${fk.column} → ${fk.references}`);
        }
      }
    }
    
    // ==========================================
    // 7. CHECK DATA INTEGRITY
    // ==========================================
    log.title('7. DATA INTEGRITY CHECK');
    
    if (tableNames.includes('cultural_objects')) {
      const [coCount] = await connection.query('SELECT COUNT(*) as count FROM cultural_objects');
      log.info(`Cultural objects in database: ${coCount[0].count}`);
      
      if (objectDetailsTable) {
        const [odCount] = await connection.query(`SELECT COUNT(*) as count FROM ${objectDetailsTable}`);
        log.info(`Object details records: ${odCount[0].count}`);
        
        if (coCount[0].count !== odCount[0].count) {
          log.warning(`Mismatch: ${coCount[0].count} objects but ${odCount[0].count} details records`);
        } else {
          log.success('Cultural objects and details counts match');
        }
        
        // Check how many have maintenance enabled
        const [maintenanceCount] = await connection.query(`
          SELECT COUNT(*) as count 
          FROM ${objectDetailsTable} 
          WHERE maintenance_reminder_enabled = TRUE
        `);
        log.info(`Objects with maintenance tracking enabled: ${maintenanceCount[0].count}`);
        
        // Check maintenance alerts
        const [overdueCount] = await connection.query(`
          SELECT COUNT(*) as count 
          FROM ${objectDetailsTable} 
          WHERE maintenance_reminder_enabled = TRUE 
            AND next_maintenance_date < CURDATE()
        `);
        
        const [dueSoonCount] = await connection.query(`
          SELECT COUNT(*) as count 
          FROM ${objectDetailsTable} 
          WHERE maintenance_reminder_enabled = TRUE 
            AND next_maintenance_date >= CURDATE()
            AND next_maintenance_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        `);
        
        if (overdueCount[0].count > 0) {
          log.warning(`⏰ ${overdueCount[0].count} object(s) with OVERDUE maintenance`);
        }
        if (dueSoonCount[0].count > 0) {
          log.info(`📅 ${dueSoonCount[0].count} object(s) with maintenance DUE SOON (within 30 days)`);
        }
        if (overdueCount[0].count === 0 && dueSoonCount[0].count === 0 && maintenanceCount[0].count > 0) {
          log.success('All objects with maintenance tracking are up to date!');
        }
      }
    }
    
    // ==========================================
    // 8. CHECK USER ACTIVITY LOGS
    // ==========================================
    log.title('8. CHECKING USER ACTIVITY LOGS');
    
    if (tableNames.includes('user_activity_logs')) {
      log.success('user_activity_logs table exists');
      
      const [logCount] = await connection.query('SELECT COUNT(*) as count FROM user_activity_logs');
      log.info(`Activity logs in database: ${logCount[0].count}`);
    } else {
      log.error('user_activity_logs table is MISSING');
      log.warning('Activity logging may not be working properly');
    }
    
    // ==========================================
    // SUMMARY
    // ==========================================
    log.title('VERIFICATION SUMMARY');
    
    const summary = {
      totalTables: tableNames.length,
      expectedTables: EXPECTED_TABLES.length,
      missingTables: missingTables.length,
      maintenanceSystem: objectDetailsTable ? 'FOUND' : 'MISSING',
      maintenanceFields: objectDetailsTable ? 'Check above' : 'N/A',
      status: 'COMPLETE'
    };
    
    console.log(`
Total Tables Found:     ${summary.totalTables}
Expected Tables:        ${summary.expectedTables}
Missing Tables:         ${summary.missingTables}
Maintenance System:     ${summary.maintenanceSystem}
    `);
    
    if (missingTables.length === 0 && objectDetailsTable) {
      log.success('✨ Database structure verification PASSED!');
    } else if (missingTables.length > 0) {
      log.error(`⚠️  Verification found ${missingTables.length} missing table(s)`);
      console.log('Missing tables:', missingTables.join(', '));
    }
    
    if (objectDetailsTable && objectDetailsTable === 'oobject_details') {
      log.warning('\n⚠️  IMPORTANT: Your table is named "oobject_details" (double-o)');
      log.warning('   This might be a typo. Standard name is "object_details"');
    }
    
  } catch (error) {
    log.error(`Database verification failed: ${error.message}`);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
      log.info('Database connection closed');
    }
  }
}

// Run the verification
verifyDatabase().catch(console.error);








