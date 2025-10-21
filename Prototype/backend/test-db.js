const db = require('./db');

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Check cultural objects
    const [objects] = await db.query('SELECT COUNT(*) as count FROM cultural_objects');
    console.log('Cultural objects count:', objects[0].count);
    
    // Check object details
    const [details] = await db.query('SELECT COUNT(*) as count FROM object_details');
    console.log('Object details count:', details[0].count);
    
    // Check images
    const [images] = await db.query('SELECT COUNT(*) as count FROM images');
    console.log('Images count:', images[0].count);
    
    // Get sample data
    const [sampleObjects] = await db.query(`
      SELECT 
        co.id,
        co.name,
        co.category,
        co.description,
        co.created_at,
        od.period,
        od.origin,
        od.material,
        od.estimated_value
      FROM cultural_objects co
      LEFT JOIN object_details od ON co.id = od.cultural_object_id
      LIMIT 5
    `);
    
    console.log('\nSample cultural objects:');
    sampleObjects.forEach((obj, index) => {
      console.log(`${index + 1}. ID: ${obj.id}, Name: ${obj.name}, Category: ${obj.category}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Database error:', error);
    process.exit(1);
  }
}

testDatabase();

