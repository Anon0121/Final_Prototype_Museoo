// Debug script to test QR code data parsing
// Run this with: node debug_qr_code.js

const fetch = require('node-fetch');

// Replace with your actual QR code data from the scanner
const testQRCodeData = `{
  "type": "additional_visitor",
  "tokenId": "your-token-id-here",
  "bookingId": "your-booking-id-here",
  "email": "jfamboy13216@liceo.edu.ph",
  "visitDate": "2025-09-16",
  "visitTime": "15:00 - 16:00",
  "visitorDetails": {
    "firstName": "John",
    "lastName": "Doe",
    "gender": "male",
    "address": "123 Main St",
    "visitorType": "Additional Visitor",
    "institution": "Liceo de Cagayan University",
    "purpose": "educational"
  }
}`;

async function debugQRCode() {
  try {
    console.log('🔍 Testing QR Code Debug Endpoint...');
    console.log('📱 QR Code Data:', testQRCodeData);
    
    const response = await fetch('http://localhost:3000/api/additional-visitors/debug-qr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        qrCodeData: testQRCodeData
      })
    });
    
    const result = await response.json();
    
    console.log('📋 Debug Result:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Debug completed successfully!');
      console.log('📊 Strategies tested:');
      result.strategies.forEach((strategy, index) => {
        console.log(`${index + 1}. ${strategy.name}: ${strategy.found ? '✅ Found' : '❌ Not found'}`);
        if (strategy.found && strategy.data) {
          console.log(`   - Name: ${strategy.data.first_name} ${strategy.data.last_name}`);
          console.log(`   - Email: ${strategy.data.email}`);
          console.log(`   - Gender: ${strategy.data.gender}`);
          console.log(`   - Address: ${strategy.data.address}`);
        }
      });
    } else {
      console.log('❌ Debug failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error running debug:', error.message);
  }
}

// Instructions
console.log('🔧 QR Code Debug Tool');
console.log('====================');
console.log('');
console.log('📝 Instructions:');
console.log('1. Replace the testQRCodeData with your actual QR code data');
console.log('2. Make sure your backend server is running on localhost:3000');
console.log('3. Run this script with: node debug_qr_code.js');
console.log('');
console.log('🎯 This will help identify:');
console.log('- What data is in the QR code');
console.log('- Which database lookup strategies work');
console.log('- What visitor data is found in the database');
console.log('');

// Run the debug
debugQRCode();
