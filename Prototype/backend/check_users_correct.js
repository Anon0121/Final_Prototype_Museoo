const mysql = require('mysql2/promise');

async function checkUsers() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'museosmart'
  });

  try {
    const [rows] = await pool.query('SELECT user_ID, username, firstname, lastname, role, status FROM system_user');
    console.log('Users in database:');
    rows.forEach(user => {
      console.log(`- ID: ${user.user_ID}, Username: ${user.username}, Name: ${user.firstname} ${user.lastname}, Role: ${user.role}, Status: ${user.status}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkUsers();
