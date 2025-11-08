import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🔐 Setting up HTTPS for local development...');

const createCertificates = () => {
  const certsDir = path.join(process.cwd(), 'certs');
  
  // Create certs directory if it doesn't exist
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
    console.log('📁 Created certs directory');
  }

  try {
    // Check if OpenSSL is available
    execSync('openssl version', { stdio: 'pipe' });
    console.log('✅ OpenSSL found, generating certificates...');
    
    // Generate private key
    execSync('openssl genrsa -out certs/localhost-key.pem 2048', { stdio: 'inherit' });
    
    // Generate certificate
    execSync('openssl req -new -x509 -key certs/localhost-key.pem -out certs/localhost.pem -days 365 -subj "/C=US/ST=Local/L=Local/O=Development/CN=localhost"', { stdio: 'inherit' });
    
    console.log('✅ SSL certificates generated successfully!');
    console.log('📁 Certificates saved in:', certsDir);
    
  } catch (error) {
    console.log('⚠️  OpenSSL not found, using alternative method...');
    
    // Create a simple certificate info file
    const certInfo = {
      message: "For HTTPS setup:",
      instructions: [
        "1. Install OpenSSL: https://slproweb.com/products/Win32OpenSSL.html",
        "2. Or use mkcert: https://github.com/FiloSottile/mkcert",
        "3. Or use Vite's built-in HTTPS (current setup)"
      ],
      current: "Using Vite's built-in HTTPS with self-signed certificates"
    };
    
    fs.writeFileSync(path.join(certsDir, 'setup-info.json'), JSON.stringify(certInfo, null, 2));
    console.log('📝 Created setup instructions in certs/setup-info.json');
  }
};

createCertificates();
