const db = require('./db');

async function quickTest() {
  try {
    console.log('🔍 Quick database test...');
    
    // Test basic connection
    const [result] = await db.query('SELECT 1 as test');
    console.log('✅ Database connection working:', result[0].test);
    
    // Check cultural objects
    const [objects] = await db.query('SELECT COUNT(*) as count FROM cultural_objects');
    console.log('📊 Cultural objects count:', objects[0].count);
    
    // Check object details
    const [details] = await db.query('SELECT COUNT(*) as count FROM object_details');
    console.log('📊 Object details count:', details[0].count);
    
    // Check images
    const [images] = await db.query('SELECT COUNT(*) as count FROM images');
    console.log('📊 Images count:', images[0].count);
    
    // Get sample data
    const [sample] = await db.query(`
      SELECT 
        co.id,
        co.name,
        co.category,
        co.created_at,
        od.acquisition_date
      FROM cultural_objects co
      LEFT JOIN object_details od ON co.id = od.cultural_object_id
      LIMIT 3
    `);
    
    console.log('\n📋 Sample cultural objects:');
    sample.forEach((obj, index) => {
      console.log(`${index + 1}. ID: ${obj.id}, Name: ${obj.name}, Category: ${obj.category}`);
      console.log(`   Created: ${obj.created_at}, Acquisition: ${obj.acquisition_date || 'N/A'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

quickTest();

