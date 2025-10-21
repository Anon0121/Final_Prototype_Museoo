const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupApprovalSystem() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'museosmart'
    });

    console.log('🔧 Setting up approval system for event registrations...');

    // 1. Add approval columns to event_registrations table
    console.log('📝 Adding approval columns...');
    await connection.execute(`
      ALTER TABLE event_registrations 
      ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' AFTER status,
      ADD COLUMN approval_date TIMESTAMP NULL AFTER approval_status,
      ADD COLUMN approved_by VARCHAR(100) NULL AFTER approval_date,
      ADD COLUMN rejection_reason TEXT NULL AFTER approved_by
    `);

    // 2. Update status enum to include pending_approval
    console.log('🔄 Updating status enum...');
    await connection.execute(`
      ALTER TABLE event_registrations 
      MODIFY COLUMN status ENUM('pending_approval', 'registered', 'checked_in', 'cancelled') DEFAULT 'pending_approval'
    `);

    // 3. Update existing records
    console.log('📊 Updating existing registrations...');
    await connection.execute(`
      UPDATE event_registrations 
      SET status = 'pending_approval', 
          approval_status = 'pending' 
      WHERE status = 'registered'
    `);

    // 4. Add indexes
    console.log('⚡ Adding performance indexes...');
    await connection.execute(`
      CREATE INDEX idx_event_registrations_approval_status ON event_registrations(approval_status)
    `);
    
    await connection.execute(`
      CREATE INDEX idx_event_registrations_approval_date ON event_registrations(approval_date)
    `);

    // 5. Verify the changes
    console.log('✅ Verifying changes...');
    const [columns] = await connection.execute(`
      DESCRIBE event_registrations
    `);
    
    console.log('\n📋 Updated table structure:');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    // 6. Show sample data
    const [sampleData] = await connection.execute(`
      SELECT 
        id, 
        firstname, 
        lastname, 
        email, 
        status, 
        approval_status, 
        approval_date, 
        approved_by 
      FROM event_registrations 
      LIMIT 5
    `);

    console.log('\n📊 Sample data:');
    sampleData.forEach(row => {
      console.log(`  ID: ${row.id}, Name: ${row.firstname} ${row.lastname}, Status: ${row.status}, Approval: ${row.approval_status}`);
    });

    console.log('\n🎉 Approval system setup completed successfully!');
    console.log('\n📋 What was added:');
    console.log('  ✅ approval_status (pending/approved/rejected)');
    console.log('  ✅ approval_date (timestamp)');
    console.log('  ✅ approved_by (admin name)');
    console.log('  ✅ rejection_reason (text)');
    console.log('  ✅ status now includes "pending_approval"');
    console.log('  ✅ Performance indexes for approval queries');

  } catch (error) {
    console.error('❌ Error setting up approval system:', error.message);
    
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  Some columns already exist, continuing...');
    } else if (error.code === 'ER_DUP_KEYNAME') {
      console.log('ℹ️  Some indexes already exist, continuing...');
    } else {
      throw error;
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the setup
setupApprovalSystem()
  .then(() => {
    console.log('\n✨ Setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
