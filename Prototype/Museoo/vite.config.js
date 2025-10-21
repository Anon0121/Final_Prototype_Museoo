import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    host: '0.0.0.0', // Allow external access
    port: 5173, // Use standard Vite port
    strictPort: true, // Use exact port
    https: (() => {
      try {
        return {
          key: fs.readFileSync(path.resolve(__dirname, '../localhost-key.pem')),
          cert: fs.readFileSync(path.resolve(__dirname, '../localhost.pem')),
        }
      } catch (error) {
        console.log('⚠️  HTTPS certificates not found. Running in HTTP mode.');
        console.log('📱 Camera access may be limited. Use file upload for QR scanning.');
        return false
      }
    })(),
  },
})
