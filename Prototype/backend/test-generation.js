const { generateCulturalObjectsReport } = require('./additional-report-functions');

async function testGeneration() {
  try {
    console.log('Testing cultural objects report generation...');
    const result = await generateCulturalObjectsReport('2025-01-01', '2025-12-31');
    console.log('Total objects found:', result.totalObjects);
    console.log('Objects:');
    result.objects.forEach(obj => {
      console.log(`  - ID: ${obj.id}, Name: ${obj.name}, Category: ${obj.category}`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testGeneration();
