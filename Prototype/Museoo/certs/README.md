{
  "message": "For secure HTTPS with trusted certificates:",
  "steps": [
    "1. Install mkcert: https://github.com/FiloSottile/mkcert",
    "2. Run: mkcert -install",
    "3. Run: mkcert localhost 192.168.1.9 127.0.0.1",
    "4. Move the generated files to certs/ directory",
    "5. Restart the development server"
  ],
  "alternative": "Current setup uses Vite's built-in HTTPS (self-signed)"
}