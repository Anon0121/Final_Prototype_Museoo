const db = require('./db');

async function checkAllObjects() {
  try {
    const [objects] = await db.query('SELECT id, name, category FROM cultural_objects');
    console.log('Total cultural objects in database:', objects.length);
    objects.forEach((obj, index) => {
      console.log(`${index + 1}. ID: ${obj.id}, Name: ${obj.name}, Category: ${obj.category}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAllObjects();
