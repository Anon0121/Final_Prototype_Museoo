const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔐 Generating SSL certificates for local development...');

try {
  // Create certificates directory
  const certsDir = path.join(__dirname, 'certs');
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }

  // Generate private key
  console.log('📝 Creating private key...');
  execSync('openssl genrsa -out certs/localhost-key.pem 2048', { stdio: 'inherit' });

  // Generate certificate
  console.log('📜 Creating certificate...');
  execSync('openssl req -new -x509 -key certs/localhost-key.pem -out certs/localhost.pem -days 365 -subj "/C=US/ST=Local/L=Local/O=Development/CN=localhost"', { stdio: 'inherit' });

  console.log('✅ SSL certificates generated successfully!');
  console.log('📁 Certificates saved in:', certsDir);
  console.log('🔒 You can now use HTTPS for camera access');

} catch (error) {
  console.error('❌ Error generating certificates:', error.message);
  console.log('💡 Make sure OpenSSL is installed or use the alternative method below');
}
