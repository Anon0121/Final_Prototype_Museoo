const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function enhanceDonationSystem() {
  let connection;
  
  try {
    // Database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'museum_db'
    });

    console.log('Connected to database successfully');

    // Read and execute the SQL migration
    const sqlPath = path.join(__dirname, '../database/enhance_donation_system.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 100) + '...');
        await connection.execute(statement);
      }
    }

    console.log('✅ Enhanced donation system migration completed successfully!');
    
    // Verify the changes
    console.log('\n📋 New tables created:');
    const tables = ['donation_documents', 'donation_workflow_log', 'donation_acknowledgments', 'donation_requirements'];
    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`DESCRIBE ${table}`);
        console.log(`  ✅ ${table}: ${rows.length} columns`);
      } catch (error) {
        console.log(`  ❌ ${table}: Error checking table`);
      }
    }

    // Show enhanced donations table structure
    console.log('\n📋 Enhanced donations table structure:');
    const [donationRows] = await connection.execute('DESCRIBE donations');
    donationRows.forEach(row => {
      console.log(`  - ${row.Field}: ${row.Type} ${row.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${row.Default ? `DEFAULT ${row.Default}` : ''}`);
    });

    // Show enhanced donation_details table structure
    console.log('\n📋 Enhanced donation_details table structure:');
    const [detailsRows] = await connection.execute('DESCRIBE donation_details');
    detailsRows.forEach(row => {
      console.log(`  - ${row.Field}: ${row.Type} ${row.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${row.Default ? `DEFAULT ${row.Default}` : ''}`);
    });

    // Count existing donations
    const [donationCount] = await connection.execute('SELECT COUNT(*) as count FROM donations');
    console.log(`\n📊 Existing donations: ${donationCount[0].count}`);

    // Count requirements created
    const [requirementsCount] = await connection.execute('SELECT COUNT(*) as count FROM donation_requirements');
    console.log(`📊 Requirements created: ${requirementsCount[0].count}`);

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration
enhanceDonationSystem();
