const mysql = require('mysql2/promise');

async function testExhibits() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'museosmart'
    });

    console.log('🔍 Checking exhibits in database...');
    
    // Check exhibits
    const [exhibits] = await conn.execute(`
      SELECT a.id, a.title, a.description, ed.start_date, ed.end_date, ed.location, ed.curator, ed.category 
      FROM activities a 
      JOIN exhibit_details ed ON a.id = ed.activity_id 
      WHERE a.type = 'exhibit'
    `);
    
    console.log(`📊 Found ${exhibits.length} exhibits:`);
    exhibits.forEach(ex => {
      console.log(`- ${ex.title} | ${ex.start_date} to ${ex.end_date}`);
    });

    // Check images
    const [images] = await conn.execute(`
      SELECT * FROM images WHERE activity_id IS NOT NULL
    `);
    
    console.log(`🖼️ Found ${images.length} activity images:`);
    images.forEach(img => {
      console.log(`- Activity ${img.activity_id}: ${img.url}`);
    });

    await conn.end();
    console.log('✅ Database check complete');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testExhibits();
