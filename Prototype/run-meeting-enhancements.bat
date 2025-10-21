@echo off
echo ========================================
echo Donation Meeting Enhancements Migration
echo ========================================
echo.

cd /d "%~dp0\backend"

echo Running migration to add missing database fields...
echo.

node run-meeting-enhancements-migration.js

echo.
echo Migration completed!
echo.
pause

