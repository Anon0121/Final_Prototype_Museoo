@echo off
echo Adding Archive Categories to Database...
echo.

cd backend
node scripts/add_archive_categories.js

echo.
echo Migration completed!
pause
