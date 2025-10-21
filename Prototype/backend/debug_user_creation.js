const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'museosmart'
});

async function debugUserCreation() {
  try {
    // Check user_permissions table structure
    console.log('📋 Checking user_permissions table structure...');
    const [structure] = await pool.query('DESCRIBE user_permissions');
    console.table(structure);
    
    // Check if there are any foreign key constraints
    console.log('\n🔗 Checking foreign key constraints...');
    const [constraints] = await pool.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = 'museosmart' 
      AND TABLE_NAME = 'user_permissions'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    console.table(constraints);
    
    // Check existing users to see if we can test permissions insertion
    console.log('\n👥 Checking existing users...');
    const [users] = await pool.query('SELECT user_ID, username FROM system_user LIMIT 3');
    console.table(users);
    
    if (users.length > 0) {
      const testUserId = users[0].user_ID;
      console.log(`\n🧪 Testing permissions insertion for user ID: ${testUserId}`);
      
      try {
        // Try to insert a test permission
        await pool.query(`
          INSERT INTO user_permissions (user_id, permission_name, is_allowed, access_level) 
          VALUES (?, ?, ?, ?)
        `, [testUserId, 'test_permission', true, 'edit']);
        
        console.log('✅ Test permission insertion successful');
        
        // Clean up test data
        await pool.query('DELETE FROM user_permissions WHERE permission_name = ?', ['test_permission']);
        console.log('🧹 Test data cleaned up');
        
      } catch (testErr) {
        console.error('❌ Test permission insertion failed:', testErr.message);
        console.error('❌ Error code:', testErr.code);
      }
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
}

debugUserCreation();




