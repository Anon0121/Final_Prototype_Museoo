const axios = require('axios');

async function testImages() {
  try {
    const response = await axios.get('http://localhost:3000/api/cultural-objects');
    console.log('API Response:');
    console.log('- Object ID:', response.data[0].id);
    console.log('- Cultural Object ID in details:', response.data[0].cultural_object_id);
    console.log('- Images:', response.data[0].images);
    
    if (response.data[0].images.length > 0) {
      console.log('✅ SUCCESS: Images are now loading!');
      console.log('First image URL:', response.data[0].images[0]);
    } else {
      console.log('❌ Images are still empty');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testImages();
