@echo off
echo Adding maintenance reminder system to cultural objects...
echo.

cd /d "%~dp0"

echo Running database migration...
node "Prototype\backend\scripts\add_maintenance_reminders.js"

echo.
echo Maintenance reminder system setup complete!
echo.
echo Features added:
echo - Maintenance tracking fields in database
echo - Maintenance overview and alerts API endpoints
echo - Frontend maintenance management interface
echo - Maintenance reminder notifications
echo.
echo You can now:
echo 1. Set maintenance schedules for cultural objects
echo 2. View maintenance alerts and overdue items
echo 3. Track maintenance history and costs
echo 4. Assign maintenance contacts and priorities
echo.
pause
