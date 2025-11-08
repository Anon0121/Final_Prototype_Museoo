@echo off
echo 🔐 Installing mkcert for trusted HTTPS certificates...
echo.

echo Step 1: Downloading mkcert...
echo Please download mkcert from: https://github.com/FiloSottile/mkcert/releases
echo Download the Windows version (mkcert-v1.4.4-windows-amd64.exe)
echo Save it to: C:\Windows\System32\mkcert.exe
echo.

echo Step 2: After downloading, run these commands:
echo mkcert -install
echo mkcert localhost 192.168.1.9 127.0.0.1
echo.

echo Step 3: Move the generated files to certs/ folder:
echo move localhost+2.pem certs/localhost.pem
echo move localhost+2-key.pem certs/localhost-key.pem
echo.

echo Step 4: Restart the development server
echo npm run dev
echo.

echo 📱 After setup, camera will work without security warnings!
pause
