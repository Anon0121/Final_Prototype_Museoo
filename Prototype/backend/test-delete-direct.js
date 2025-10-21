const axios = require('axios');

async function testDeleteDirect() {
  try {
    console.log('=== Testing Cultural Objects Delete ===');
    
    // First, get all objects
    console.log('\n1. Getting all objects...');
    const getResponse = await axios.get('http://localhost:3000/api/cultural-objects');
    console.log('Objects before delete:', getResponse.data.length);
    console.log('First object:', getResponse.data[0]);
    
    if (getResponse.data.length > 0) {
      const objectToDelete = getResponse.data[0];
      const objectId = objectToDelete.id;
      
      console.log(`\n2. Attempting to delete object with ID: ${objectId}`);
      
      // Delete the object
      const deleteResponse = await axios.delete(`http://localhost:3000/api/cultural-objects/${objectId}`);
      console.log('Delete response status:', deleteResponse.status);
      console.log('Delete response data:', deleteResponse.data);
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get all objects again
      console.log('\n3. Getting all objects after delete...');
      const getResponseAfter = await axios.get('http://localhost:3000/api/cultural-objects');
      console.log('Objects after delete:', getResponseAfter.data.length);
      
      // Check if the object is still there
      const stillExists = getResponseAfter.data.find(obj => obj.id === objectId);
      if (stillExists) {
        console.log('❌ ERROR: Object still exists after delete!');
        console.log('Object that should be deleted:', stillExists);
      } else {
        console.log('✅ SUCCESS: Object was deleted successfully!');
      }
    } else {
      console.log('No objects to delete');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testDeleteDirect();

