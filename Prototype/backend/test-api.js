const axios = require('axios');

async function testAPI() {
  try {
    console.log('🔍 Testing exhibits API...');
    const response = await axios.get('http://localhost:3000/api/activities/exhibits');
    
    console.log(`✅ API Response: ${response.data.length} exhibits found`);
    response.data.forEach(ex => {
      console.log(`- ${ex.title} | Images: ${ex.images?.length || 0}`);
      if (ex.images && ex.images.length > 0) {
        console.log(`  Images: ${ex.images.join(', ')}`);
      }
    });
  } catch (error) {
    console.error('❌ API Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAPI();
