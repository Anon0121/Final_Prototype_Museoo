const { generateCulturalObjectsReport } = require('./additional-report-functions');

async function testCulturalObjectsReport() {
  try {
    console.log('🧪 Testing Cultural Objects Report Generation...');
    
    // Test with a wide date range
    const startDate = '2020-01-01';
    const endDate = '2030-12-31';
    
    console.log(`📅 Testing with date range: ${startDate} to ${endDate}`);
    
    const result = await generateCulturalObjectsReport(startDate, endDate);
    
    console.log('\n📊 Report Results:');
    console.log(`Total Objects: ${result.totalObjects}`);
    console.log(`Total Categories: ${result.summary?.totalCategories || 0}`);
    console.log(`Total Estimated Value: ₱${result.summary?.totalEstimatedValue || 0}`);
    
    if (result.objects && result.objects.length > 0) {
      console.log('\n📋 Sample Objects:');
      result.objects.slice(0, 5).forEach((obj, index) => {
        console.log(`${index + 1}. ID: ${obj.id}, Name: ${obj.name}, Category: ${obj.category}`);
        console.log(`   Period: ${obj.period || 'N/A'}, Origin: ${obj.origin || 'N/A'}`);
        console.log(`   Estimated Value: ₱${obj.estimated_value || 'N/A'}`);
        console.log(`   Images: ${obj.images ? obj.images.length : 0}`);
        console.log('');
      });
    } else {
      console.log('\n❌ No cultural objects found!');
    }
    
    if (result.categories && result.categories.length > 0) {
      console.log('\n📊 Categories:');
      result.categories.forEach(cat => {
        console.log(`- ${cat.category}: ${cat.count} objects, Total Value: ₱${cat.total_value || 0}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing cultural objects report:', error);
    process.exit(1);
  }
}

testCulturalObjectsReport();

