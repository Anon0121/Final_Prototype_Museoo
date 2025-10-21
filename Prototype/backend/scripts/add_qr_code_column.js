const mysql = require('mysql2/promise');
require('dotenv').config();

async function addQrCodeColumn() {
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

    // Add qr_code field to additional_visitors table
    console.log('📝 Adding qr_code field to additional_visitors table...');
    await connection.execute(`
      ALTER TABLE additional_visitors 
      ADD COLUMN IF NOT EXISTS qr_code LONGTEXT NULL
    `);
    console.log('✅ Added qr_code field to additional_visitors table');

    // Create index for better performance
    console.log('📊 Creating index...');
    try {
      await connection.execute(`
        CREATE INDEX idx_additional_visitors_qr_code ON additional_visitors(qr_code(100))
      `);
      console.log('✅ Created index for additional_visitors.qr_code');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Index already exists for additional_visitors.qr_code');
      } else {
        throw err;
      }
    }

    // Show the updated table structure
    console.log('\n📋 Updated additional_visitors table structure:');
    
    const [additionalVisitorsColumns] = await connection.execute('DESCRIBE additional_visitors');
    console.log('\nadditional_visitors table:');
    additionalVisitorsColumns.forEach(col => {
      console.log(`  ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default} | ${col.Extra}`);
    });

    console.log('\n🎉 QR code column added successfully!');
    console.log('🚀 Additional visitor QR code generation should now work!');

  } catch (error) {
    console.error('❌ Error adding QR code column:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
addQrCodeColumn();
