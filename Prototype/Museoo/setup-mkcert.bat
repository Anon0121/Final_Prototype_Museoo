@echo off
echo 🔐 Setting up mkcert for trusted HTTPS certificates...
echo.

echo Step 1: Download mkcert-v1.4.4-windows-amd64.exe from GitHub
echo Step 2: Rename it to mkcert.exe
echo Step 3: Copy it to C:\Windows\System32\
echo.

echo After installation, run these commands:
echo mkcert -install
echo mkcert localhost 192.168.1.9 127.0.0.1
echo.

echo Then move the generated files:
echo move localhost+2.pem certs/localhost.pem
echo move localhost+2-key.pem certs/localhost-key.pem
echo.

echo 📱 After setup, camera will work without security warnings!
echo 🌐 Access: https://192.168.1.9:5173/admin
echo.

pause
