@echo off
echo Starting VitalSense Application...

echo.
echo Installing server dependencies...
cd server
call npm install

echo.
echo Installing client dependencies...
cd ..\client
call npm install

echo.
echo Starting server in background...
cd ..\server
start "VitalSense Server" cmd /k "npm run dev"

echo.
echo Starting client...
cd ..\client
start "VitalSense Client" cmd /k "npm run dev"

echo.
echo Both server and client are starting...
echo Server: http://localhost:5002
echo Client: http://localhost:5173
pause