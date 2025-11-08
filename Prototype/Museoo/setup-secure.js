import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔐 Setting up secure HTTPS for local development...');

// Create a simple certificate setup
const setupSecure = () => {
  const certsDir = path.join(__dirname, 'certs');
  
  // Create certificates directory
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }

  // Create a simple certificate info file
  const certInfo = {
    message: "For secure HTTPS with trusted certificates:",
    steps: [
      "1. Install mkcert: https://github.com/FiloSottile/mkcert",
      "2. Run: mkcert -install",
      "3. Run: mkcert localhost 192.168.1.9 127.0.0.1",
      "4. Move the generated files to certs/ directory",
      "5. Restart the development server"
    ],
    alternative: "Current setup uses Vite's built-in HTTPS (self-signed)"
  };

  fs.writeFileSync(path.join(certsDir, 'README.md'), JSON.stringify(certInfo, null, 2));
  
  console.log('📁 Created certs directory');
  console.log('💡 For trusted certificates, follow the steps in certs/README.md');
  console.log('🔒 Current setup uses Vite\'s built-in HTTPS');
};

setupSecure();
