const mysql = require('mysql2/promise');

async function fixFallbackBackupCodes() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'museosmart'
  });

  try {
    console.log('🔧 Starting fix for FALLBACK backup codes...\n');

    // Find all visitors with FALLBACK backup codes
    const [visitors] = await pool.query(
      `SELECT visitor_id, email, booking_id, is_main_visitor, backup_code 
       FROM visitors 
       WHERE backup_code = 'FALLBACK' 
       ORDER BY visitor_id DESC`
    );

    console.log(`📋 Found ${visitors.length} visitors with FALLBACK backup codes\n`);

    if (visitors.length === 0) {
      console.log('✅ No visitors with FALLBACK backup codes found. All good!');
      await pool.end();
      return;
    }

    let fixed = 0;
    let skipped = 0;

    for (const visitor of visitors) {
      try {
        // Generate a new random backup code (4 characters, uppercase)
        const newBackupCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        
        // Update the visitor record
        await pool.query(
          `UPDATE visitors SET backup_code = ? WHERE visitor_id = ?`,
          [newBackupCode, visitor.visitor_id]
        );

        console.log(`✅ Fixed visitor ${visitor.visitor_id} (${visitor.email}): ${newBackupCode}`);
        fixed++;
      } catch (err) {
        console.error(`❌ Error fixing visitor ${visitor.visitor_id}:`, err.message);
        skipped++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Fixed: ${fixed}`);
    console.log(`   ⚠️  Skipped: ${skipped}`);
    console.log(`   📝 Total: ${visitors.length}\n`);

    // Verify the fix
    const [remaining] = await pool.query(
      `SELECT COUNT(*) as count FROM visitors WHERE backup_code = 'FALLBACK'`
    );
    
    if (remaining[0].count === 0) {
      console.log('✅ All FALLBACK backup codes have been fixed!');
    } else {
      console.log(`⚠️  Warning: ${remaining[0].count} FALLBACK backup codes still remain.`);
    }

  } catch (err) {
    console.error('❌ Error fixing backup codes:', err);
  } finally {
    await pool.end();
  }
}

fixFallbackBackupCodes();

