@echo off
echo ========================================
echo   CLEANING UP UNNECESSARY FILES
echo ========================================
echo.
echo This script will remove unnecessary files from your project.
echo.
echo Files to be removed:
echo   1. Git command artifacts
echo   2. Backup files with strange names
echo   3. Temporary reports from cleanup
echo   4. Generated chart images
echo   5. Redundant documentation
echo.
pause

echo.
echo ========================================
echo Step 1: Removing git command artifacts
echo ========================================
echo.

REM Remove the git command file
if exist "et --hard fb88580" (
    del "et --hard fb88580"
    echo ✅ Removed: et --hard fb88580
) else (
    echo ⚠️  File not found: et --hard fb88580
)

echo.
echo ========================================
echo Step 2: Removing backup files
echo ========================================
echo.

REM Remove backup file with strange name
for %%f in (*backup*) do (
    if exist "%%f" (
        del "%%f"
        echo ✅ Removed: %%f
    )
)

echo.
echo ========================================
echo Step 3: Removing temporary reports
echo ========================================
echo.

REM Remove temporary reports from our cleanup
if exist "DATA_MIGRATION_REPORT.txt" (
    del "DATA_MIGRATION_REPORT.txt"
    echo ✅ Removed: DATA_MIGRATION_REPORT.txt
)

if exist "DONATIONS_CLEANUP_COMPLETE.txt" (
    del "DONATIONS_CLEANUP_COMPLETE.txt"
    echo ✅ Removed: DONATIONS_CLEANUP_COMPLETE.txt
)

if exist "CLEANUP_SUMMARY.md" (
    del "CLEANUP_SUMMARY.md"
    echo ✅ Removed: CLEANUP_SUMMARY.md
)

echo.
echo ========================================
echo Step 4: Removing redundant documentation
echo ========================================
echo.

REM Remove redundant documentation
if exist "DATABASE_ANALYSIS_SUMMARY.md" (
    del "DATABASE_ANALYSIS_SUMMARY.md"
    echo ✅ Removed: DATABASE_ANALYSIS_SUMMARY.md
)

if exist "README_DATABASE_ANALYSIS.md" (
    del "README_DATABASE_ANALYSIS.md"
    echo ✅ Removed: README_DATABASE_ANALYSIS.md
)

if exist "DONATION_TABLE_CLEANUP_PLAN.md" (
    del "DONATION_TABLE_CLEANUP_PLAN.md"
    echo ✅ Removed: DONATION_TABLE_CLEANUP_PLAN.md
)

echo.
echo ========================================
echo Step 5: Removing temp directory
echo ========================================
echo.

REM Remove temp directory and its contents
if exist "temp" (
    rmdir /s /q "temp"
    echo ✅ Removed: temp directory and all contents
) else (
    echo ⚠️  Temp directory not found
)

echo.
echo ========================================
echo Step 6: Removing our cleanup scripts
echo ========================================
echo.

REM Remove our cleanup scripts (no longer needed)
if exist "run-complete-donation-cleanup.bat" (
    del "run-complete-donation-cleanup.bat"
    echo ✅ Removed: run-complete-donation-cleanup.bat
)

if exist "run-safe-donation-cleanup.bat" (
    del "run-safe-donation-cleanup.bat"
    echo ✅ Removed: run-safe-donation-cleanup.bat
)

if exist "FILE_ANALYSIS.md" (
    del "FILE_ANALYSIS.md"
    echo ✅ Removed: FILE_ANALYSIS.md
)

echo.
echo ========================================
echo              CLEANUP COMPLETE!
echo ========================================
echo.
echo The following files have been removed:
echo   ✅ Git command artifacts
echo   ✅ Backup files
echo   ✅ Temporary reports
echo   ✅ Redundant documentation
echo   ✅ Temp directory
echo   ✅ Cleanup scripts
echo.
echo Your project is now cleaner and more organized!
echo.
pause






