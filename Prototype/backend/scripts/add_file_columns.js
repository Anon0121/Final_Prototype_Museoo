const mysql = require('mysql2/promise');
require('dotenv').config();

async function addFileColumns() {
  let connection;
  
  try {
    console.log('🔧 Adding file storage columns to reports table...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'museoo_db'
    });

    // Add columns one by one
    const queries = [
      'ALTER TABLE reports ADD COLUMN pdf_file LONGBLOB NULL',
      'ALTER TABLE reports ADD COLUMN excel_file LONGBLOB NULL',
      'ALTER TABLE reports ADD COLUMN pdf_size INT NULL',
      'ALTER TABLE reports ADD COLUMN excel_size INT NULL',
      'ALTER TABLE reports ADD COLUMN pdf_filename VARCHAR(255) NULL',
      'ALTER TABLE reports ADD COLUMN excel_filename VARCHAR(255) NULL',
      'ALTER TABLE reports ADD COLUMN pdf_generated_at TIMESTAMP NULL',
      'ALTER TABLE reports ADD COLUMN excel_generated_at TIMESTAMP NULL'
    ];

    for (const query of queries) {
      try {
        await connection.execute(query);
        console.log('✅ Added column successfully');
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('ℹ️  Column already exists');
        } else {
          console.error('❌ Error:', error.message);
        }
      }
    }

    console.log('✅ All columns added successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addFileColumns();
