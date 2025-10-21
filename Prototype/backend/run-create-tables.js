const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart',
  multipleStatements: true
};

async function createMissingTables() {
  try {
    console.log('🔧 Creating missing donation workflow tables...');
    
    const conn = await mysql.createConnection(dbConfig);
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'database', 'create_missing_tables.sql');
    const migrationSQL = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📋 Executing SQL migration...');
    await conn.execute(migrationSQL);
    
    console.log('✅ All tables created successfully!');
    
    // Verify tables were created
    const [tables] = await conn.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    const requiredTables = [
      'donations', 'donation_details', 'donation_meeting_schedule', 
      'donation_city_hall_submission', 'donation_visitor_submissions', 
      'donation_workflow_log', 'donation_documents'
    ];
    
    console.log('\n📊 Table Status:');
    requiredTables.forEach(table => {
      const exists = tableNames.includes(table);
      console.log(`  ${table}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    });
    
    await conn.end();
    console.log('\n🎉 Database migration completed successfully!');
    
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    process.exit(1);
  }
}

createMissingTables();

