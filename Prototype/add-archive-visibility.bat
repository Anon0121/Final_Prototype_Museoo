@echo off
echo ========================================
echo Archive Visibility Migration
echo ========================================
echo.
echo This script will add visibility control to the digital archive system.
echo.
pause

cd backend
node scripts/add_archive_visibility.js

echo.
echo Migration completed!
pause
