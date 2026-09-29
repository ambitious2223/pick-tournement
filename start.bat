@echo off
setlocal
cd /d "%~dp0"

echo ==========================================
echo   Pick League - starting up
echo ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found.
  echo Install Node 24 or newer from https://nodejs.org and run this again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo First run: installing dependencies. This can take a minute...
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)

if not exist "data\categories\football.json" (
  echo Seeding the ten built-in categories...
  call npm run seed
)

echo.
echo   Control Room : http://127.0.0.1:5173/control
echo   Content Studio: http://127.0.0.1:5173/studio
echo   Debug Console : http://127.0.0.1:5173/debug
echo   OBS Overlay   : http://127.0.0.1:5173/overlay
echo.
echo This window does NOT open a browser. Paste a link above into the tab you want.
if /i "%PL_OPEN_BROWSER%"=="1" (
  echo Auto-open is ON - opening the Control Room ^(+4 seconds^)...
  start "" powershell -NoProfile -Command "Start-Sleep -Seconds 4; Start-Process 'http://127.0.0.1:5173/control'"
)
echo.
echo Keep this window open while testing. Press Ctrl+C to stop.
echo.

call npm run dev

echo.
echo Server stopped.
pause
