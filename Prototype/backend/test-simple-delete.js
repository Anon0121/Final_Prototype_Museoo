const axios = require('axios');

async function testSimpleDelete() {
  try {
    console.log('Testing simple delete...');
    
    // Get objects first
    const getResponse = await axios.get('http://localhost:3000/api/cultural-objects');
    console.log('Objects count:', getResponse.data.length);
    
    if (getResponse.data.length > 0) {
      const objectId = getResponse.data[0].id;
      console.log('Deleting object ID:', objectId);
      
      // Delete
      const deleteResponse = await axios.delete(`http://localhost:3000/api/cultural-objects/${objectId}`);
      console.log('Delete status:', deleteResponse.status);
      
      // Check again
      const getResponse2 = await axios.get('http://localhost:3000/api/cultural-objects');
      console.log('Objects count after delete:', getResponse2.data.length);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSimpleDelete();

