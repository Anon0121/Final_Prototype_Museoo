const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Production database setup script
async function setupProductionDatabase() {
  let connection;
  
  try {
    console.log('🚀 Setting up production database...');
    
    // Get production database configuration
    const config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    };

    // Connect to MySQL server
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL server');

    // Create database
    const dbName = process.env.DB_NAME || 'museosmart';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✅ Database "${dbName}" created/verified`);

    // Use the database
    await connection.execute(`USE ${dbName}`);

    // Create production tables
    await createProductionTables(connection);
    
    // Create indexes for performance
    await createIndexes(connection);
    
    // Set up replication user (if needed)
    if (process.env.SETUP_REPLICATION === 'true') {
      await setupReplicationUser(connection);
    }

    console.log('✅ Production database setup complete!');
    console.log('🎉 Your museum management system is ready for deployment!');

  } catch (error) {
    console.error('❌ Production database setup failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function createProductionTables(connection) {
  console.log('📋 Creating production tables...');
  
  const tables = [
    // System users
    `CREATE TABLE IF NOT EXISTS system_user (
      user_ID INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      firstname VARCHAR(50) NOT NULL,
      lastname VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'user') DEFAULT 'user',
      status ENUM('active', 'deactivated') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    
    // Visitors table
    `CREATE TABLE IF NOT EXISTS visitors (
      visitor_id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      gender ENUM('male', 'female', 'other') NOT NULL,
      email VARCHAR(100) NOT NULL,
      visitor_type VARCHAR(50) NOT NULL,
      purpose VARCHAR(100) NOT NULL,
      visit_date DATE NOT NULL,
      time_slot VARCHAR(20) NOT NULL,
      qr_code VARCHAR(500) NULL,
      scan_time TIMESTAMP NULL,
      booking_status ENUM('pending', 'confirmed', 'checked-in', 'cancelled') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    
    // Reports table
    `CREATE TABLE IF NOT EXISTS reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      report_type VARCHAR(50) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      content LONGTEXT,
      data LONGTEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES system_user(user_ID) ON DELETE CASCADE
    )`,
    
    // AI insights table
    `CREATE TABLE IF NOT EXISTS ai_insights (
      id INT AUTO_INCREMENT PRIMARY KEY,
      report_id INT NOT NULL,
      insights LONGTEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    )`,
    
    // Activities table
    `CREATE TABLE IF NOT EXISTS activities (
      activity_id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      type ENUM('event', 'exhibit') NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      status ENUM('active', 'inactive', 'completed') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Donations table
    `CREATE TABLE IF NOT EXISTS donations (
      donation_id INT AUTO_INCREMENT PRIMARY KEY,
      donor_name VARCHAR(100) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      donation_type VARCHAR(50) NOT NULL,
      donation_date DATE NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const table of tables) {
    await connection.execute(table);
  }
  
  console.log('✅ Production tables created successfully');
}

async function createIndexes(connection) {
  console.log('🔍 Creating performance indexes...');
  
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_visitors_date ON visitors(visit_date)',
    'CREATE INDEX IF NOT EXISTS idx_visitors_type ON visitors(visitor_type)',
    'CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(booking_status)',
    'CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type)',
    'CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(start_date, end_date)',
    'CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type)',
    'CREATE INDEX IF NOT EXISTS idx_donations_date ON donations(donation_date)'
  ];

  for (const index of indexes) {
    await connection.execute(index);
  }
  
  console.log('✅ Performance indexes created successfully');
}

async function setupReplicationUser(connection) {
  console.log('🔄 Setting up replication user...');
  
  const replicationUser = process.env.REPLICATION_USER || 'replication_user';
  const replicationPassword = process.env.REPLICATION_PASSWORD || 'secure_replication_password';
  
  try {
    // Create replication user
    await connection.execute(
      `CREATE USER IF NOT EXISTS '${replicationUser}'@'%' IDENTIFIED BY '${replicationPassword}'`
    );
    
    // Grant replication privileges
    await connection.execute(
      `GRANT REPLICATION SLAVE ON *.* TO '${replicationUser}'@'%'`
    );
    
    // Grant read privileges on museosmart database
    await connection.execute(
      `GRANT SELECT ON museosmart.* TO '${replicationUser}'@'%'`
    );
    
    await connection.execute('FLUSH PRIVILEGES');
    
    console.log('✅ Replication user created successfully');
    console.log(`📝 Replication user: ${replicationUser}`);
    
  } catch (error) {
    console.error('❌ Error setting up replication user:', error.message);
  }
}

// Run the setup
if (require.main === module) {
  setupProductionDatabase()
    .then(() => {
      console.log('🎉 Production database setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Production database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupProductionDatabase };


