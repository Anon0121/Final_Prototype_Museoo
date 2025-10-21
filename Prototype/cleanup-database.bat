@echo off
echo ========================================
echo    Database Cleanup Script
echo ========================================
echo.
echo This script will clean up your database by:
echo • Migrating nationality to visitor_type
echo • Implementing individual check-in times
echo • Removing deprecated fields
echo • Optimizing data types
echo • Adding performance indexes
echo • Optimizing QR code storage
echo.
echo WARNING: This will modify your database structure!
echo Make sure you have a backup before proceeding.
echo.
pause
echo.
echo Starting database cleanup...
echo.

cd backend
node scripts/master_cleanup.js

echo.
echo Database cleanup completed!
echo Check the output above for any errors.
echo.
pause



