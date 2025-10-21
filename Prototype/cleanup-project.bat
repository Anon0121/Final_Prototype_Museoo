@echo off
echo Cleaning up unnecessary project files...
echo.

echo Removing redundant startup scripts...
del start-museoo-laptop-server.bat
del start-museoo-server.bat
del start-museoo-simple.bat
del start-server.bat
del start-servers.bat
del start-servers.js
echo ✅ Removed redundant startup scripts

echo Removing utility files (not needed for basic development)...
del generate-cert.js
del https-proxy.js
del start-https-servers.js
del logo_base64.txt
echo ✅ Removed utility files

echo Removing one-time cleanup scripts...
del remove-document-type.bat
del remove-method-column.bat
echo ✅ Removed cleanup scripts

echo.
echo ========================================
echo CLEANUP COMPLETE!
echo ========================================
echo.
echo Kept essential files:
echo - start-dev.bat (main development script)
echo - package.json (dependencies)
echo - Museoo/ (frontend)
echo - backend/ (backend)
echo.
echo Your project is now cleaner and easier to navigate!
echo.
pause
