const fs = require('fs');
const path = require('path');

// Read the logo file
const logoPath = path.join(__dirname, 'Museoo', 'src', 'assets', 'logo.png');
const logoBuffer = fs.readFileSync(logoPath);

// Convert to base64
const base64Logo = logoBuffer.toString('base64');

console.log('Base64 encoded logo:');
console.log(`data:image/png;base64,${base64Logo}`);

// Save to a file for easy copying
fs.writeFileSync('logo_base64.txt', `data:image/png;base64,${base64Logo}`);
console.log('\nBase64 string saved to logo_base64.txt'); 