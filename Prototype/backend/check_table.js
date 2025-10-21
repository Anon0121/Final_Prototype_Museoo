const mysql = require('mysql2/promise');

async function checkTable() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'museosmart'
  });

  try {
    const [tables] = await pool.query('SHOW TABLES LIKE "additional_visitors"');
    console.log('additional_visitors table exists:', tables.length > 0);
    
    if (tables.length === 0) {
      console.log('Table does not exist - we need to recreate it for walk-in tokens');
    }
  } catch (e) {
    console.log('Error:', e.message);
  } finally {
    await pool.end();
  }
}

checkTable();
