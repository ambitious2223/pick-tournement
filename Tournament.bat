@echo off
setlocal
cd /d "%~dp0"
title Pick League

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

rem One-time photo fetch. Only talks to Wikipedia/Wikimedia; skipped on every later run.
rem Set PL_NO_PHOTOS=1 to skip it (offline, or you prefer to add your own photos).
if not exist "data\.photos-done" (
  if /i "%PL_NO_PHOTOS%"=="1" (
    echo Skipping photo fetch ^(PL_NO_PHOTOS=1^).
  ) else (
    echo.
    echo One-time setup: downloading free photos from Wikipedia/Wikimedia.
    echo This can take a few minutes and only happens once.
    call npm run seed:photos
    echo done > "data\.photos-done"
  )
)

echo.
echo   Control Room : http://127.0.0.1:5173/control
echo   Content Studio: http://127.0.0.1:5173/studio
echo   Debug Console : http://127.0.0.1:5173/debug
echo   OBS Overlay   : http://127.0.0.1:5173/overlay
echo.

rem Opens the Control Room in a NEW TAB of your default browser, once the server
rem is ready. It never closes or reloads your other tabs. Set PL_NO_BROWSER=1 to skip.
echo.
echo Keep this window open while testing. Press Ctrl+C to stop.
echo.
if /i "%PL_NO_BROWSER%"=="1" (
  echo Browser auto-open is OFF. Paste a link above into the tab you want.
  call npm run dev
) else (
  echo Opening the Control Room in your default browser once it is ready...
  call npm run dev -- --open
)

echo.
echo Server stopped.
pause
