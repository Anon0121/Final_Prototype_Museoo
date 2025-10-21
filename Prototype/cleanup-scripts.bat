@echo off
echo Cleaning up unnecessary backend scripts...
echo.

cd backend\scripts

echo Deleting test scripts...
del test_*.js
echo ✅ Deleted test scripts

echo Deleting debug scripts...
del debug_*.js
echo ✅ Deleted debug scripts

echo Deleting one-time setup scripts...
del add_*.js
del fix_*.js
del reset_*.js
echo ✅ Deleted one-time setup scripts

echo Deleting specific unnecessary files...
del check_booking_41.js
del check_additional_visitor_details.js
del check_institution_column.js
del check_events.js
del check_actual_dates.js
del check_visitors.js
del check_token_status.js
del check_bookings_structure.js
del check_network_access.js
del check_user_status.js
del check_database_tables.js
echo ✅ Deleted specific check files

echo Deleting migration and utility scripts...
del run_*.js
del generate_*.js
del list_*.js
del grant_*.js
del setup_network_access.js
del setup_enhanced_permissions.js
del setup_permissions.js
del setup_profile_photo.js
del hash_existing_passwords.js
del cleanup_and_restore.js
echo ✅ Deleted migration and utility scripts

echo.
echo ========================================
echo CLEANUP COMPLETE!
echo ========================================
echo.
echo Kept essential files:
echo - create_admin.js
echo - setup_complete_database.js
echo - check_database.js
echo - check_mysql.js
echo.
echo Deleted ~40+ unnecessary files
echo.
pause
