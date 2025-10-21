const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
});

async function checkTable() {
  try {
    const [rows] = await pool.query('SHOW TABLES LIKE "user_permissions"');
    console.log('📋 user_permissions table exists:', rows.length > 0);
    
    if (rows.length > 0) {
      const [structure] = await pool.query('DESCRIBE user_permissions');
      console.log('\n📊 user_permissions table structure:');
      console.table(structure);
    } else {
      console.log('❌ user_permissions table does not exist!');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkTable();




