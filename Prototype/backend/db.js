if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'museosmart',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
    console.log('\n🔧 To fix this:');
    console.log('1. Make sure MySQL is installed and running');
    console.log('2. Check your .env or environment variables');
    console.log('3. Make sure the database exists and credentials are correct');
  });

module.exports = pool;
