@echo off
title Museoo Development
color 0B

echo ========================================
echo    MUSEOO LOCAL DEVELOPMENT
echo ========================================
echo.

echo Make sure XAMPP is running (MySQL)!
echo.

echo Starting Backend Server...
cd backend
start "Backend Dev" cmd /k "title Backend && npm start"
cd ..

echo Starting Frontend Server...
cd Museoo
start "Frontend Dev" cmd /k "title Frontend && npm run dev"
cd ..

echo.
echo ========================================
echo    DEVELOPMENT SERVERS STARTED!
echo ========================================
echo.
echo Access your application at:
echo - Frontend: http://localhost:5173
echo - Backend:  http://localhost:5000
echo.
echo ========================================
echo Press any key to exit...
pause > nul
