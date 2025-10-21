const mysql = require('mysql2/promise');
require('dotenv').config();

async function addQrUsageTracking() {
  let connection;
  
  try {
    // Database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'museosmart'
    });

    console.log('🔌 Connected to database:', process.env.DB_NAME || 'museosmart');

    // Add qr_used field to additional_visitors table
    console.log('📝 Adding qr_used field to additional_visitors table...');
    await connection.execute(`
      ALTER TABLE additional_visitors 
      ADD COLUMN IF NOT EXISTS qr_used BOOLEAN DEFAULT FALSE
    `);
    console.log('✅ Added qr_used field to additional_visitors table');

    // Add qr_used field to visitors table
    console.log('📝 Adding qr_used field to visitors table...');
    await connection.execute(`
      ALTER TABLE visitors 
      ADD COLUMN IF NOT EXISTS qr_used BOOLEAN DEFAULT FALSE
    `);
    console.log('✅ Added qr_used field to visitors table');

    // Create indexes for better performance
    console.log('📊 Creating indexes...');
    try {
      await connection.execute(`
        CREATE INDEX idx_additional_visitors_qr_used ON additional_visitors(qr_used)
      `);
      console.log('✅ Created index for additional_visitors.qr_used');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Index already exists for additional_visitors.qr_used');
      } else {
        throw err;
      }
    }

    try {
      await connection.execute(`
        CREATE INDEX idx_visitors_qr_used ON visitors(qr_used)
      `);
      console.log('✅ Created index for visitors.qr_used');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Index already exists for visitors.qr_used');
      } else {
        throw err;
      }
    }

    // Show the updated table structures
    console.log('\n📋 Updated table structures:');
    
    const [additionalVisitorsColumns] = await connection.execute('DESCRIBE additional_visitors');
    console.log('\nadditional_visitors table:');
    additionalVisitorsColumns.forEach(col => {
      console.log(`  ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default} | ${col.Extra}`);
    });

    const [visitorsColumns] = await connection.execute('DESCRIBE visitors');
    console.log('\nvisitors table:');
    visitorsColumns.forEach(col => {
      console.log(`  ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default} | ${col.Extra}`);
    });

    console.log('\n🎉 QR usage tracking fields added successfully!');
    console.log('🚀 Your system now supports one-time QR code usage!');

  } catch (error) {
    console.error('❌ Error adding QR usage tracking:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
addQrUsageTracking();
