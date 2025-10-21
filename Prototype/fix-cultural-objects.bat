@echo off
echo ============================================
echo   Fix Cultural Objects Database Schema
echo ============================================
echo.
echo This script will:
echo 1. Add missing maintenance columns
echo 2. Add dimension fields (height, width, length, depth, weight)
echo 3. Ensure all required fields exist
echo.
echo IMPORTANT: Make sure MySQL is running before proceeding!
echo.
pause

echo.
echo Running database schema fix...
echo.

cd backend\database
mysql -u root -p museosmart < fix_object_details_schema.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo   SUCCESS! Database schema updated
    echo ============================================
    echo.
    echo The following changes have been applied:
    echo - Added maintenance fields: last_maintenance_date, maintenance_notes, 
    echo   maintenance_priority, maintenance_cost
    echo - Added dimension fields: height, width, length, depth, weight, dimension_unit
    echo - Added maintenance reminder fields: next_maintenance_date, 
    echo   maintenance_frequency_months, maintenance_reminder_enabled, maintenance_status
    echo.
    echo You can now create cultural objects without errors!
    echo.
) else (
    echo.
    echo ============================================
    echo   ERROR! Failed to update database
    echo ============================================
    echo.
    echo Possible issues:
    echo 1. MySQL is not running
    echo 2. Incorrect MySQL password
    echo 3. Database 'museosmart' doesn't exist
    echo.
    echo Please check the error message above and try again.
    echo.
)

pause


