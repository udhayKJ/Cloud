@echo off
REM ======================================================================
REM  CloudShift AI - one-click launcher
REM  Double-click to install dependencies (first run only), start the
REM  FastAPI backend and Next.js frontend in the background, and open the
REM  app in your browser. Use "Stop CloudShift.bat" to shut it down.
REM ======================================================================
setlocal
cd /d "%~dp0"
title CloudShift AI - Launcher

set "FRONTEND_PORT=3000"
set "BACKEND_PORT=8000"
set "APP_URL=http://localhost:%FRONTEND_PORT%"

echo.
echo  CloudShift AI - starting up...
echo  ------------------------------------------------------------

REM ---- Already running? Just open the browser. ------------------------
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort %FRONTEND_PORT% -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if %errorlevel%==0 (
    echo  CloudShift AI is already running. Opening %APP_URL% ...
    start "" "%APP_URL%"
    exit /b 0
)

REM ---- Prerequisites --------------------------------------------------
where python >nul 2>nul
if errorlevel 1 (
    echo  [!] Python 3.10+ was not found. Install it from https://www.python.org/downloads/
    echo      and tick "Add python.exe to PATH" during setup, then run this file again.
    pause
    exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
    echo  [!] Node.js 18+ was not found. Install it from https://nodejs.org/ then run this file again.
    pause
    exit /b 1
)

if not exist "logs" mkdir "logs"

REM ---- First-run dependency installation ------------------------------
python -c "import fastapi, uvicorn, pydantic" >nul 2>nul
if errorlevel 1 (
    echo  [1/2] Installing Python dependencies - first run only, please wait...
    python -m pip install -r requirements.txt > "logs\install-python.log" 2>&1
    if errorlevel 1 (
        echo  [!] Python dependency installation failed. See logs\install-python.log
        pause
        exit /b 1
    )
)
if not exist "node_modules\next" (
    echo  [2/2] Installing frontend dependencies - first run only, this can take a few minutes...
    call npm install --legacy-peer-deps > "logs\install-node.log" 2>&1
    if errorlevel 1 (
        echo  [!] Frontend dependency installation failed. See logs\install-node.log
        pause
        exit /b 1
    )
)

REM ---- Start both services hidden (output goes to the logs folder) ----
echo  Starting backend on port %BACKEND_PORT% ...
powershell -NoProfile -Command "Start-Process -WindowStyle Hidden -FilePath 'python' -ArgumentList '-m','uvicorn','backend.main:app','--host','127.0.0.1','--port','%BACKEND_PORT%' -WorkingDirectory (Get-Location) -RedirectStandardOutput 'logs\backend.log' -RedirectStandardError 'logs\backend-error.log'"

echo  Starting frontend on port %FRONTEND_PORT% ...
powershell -NoProfile -Command "Start-Process -WindowStyle Hidden -FilePath 'cmd.exe' -ArgumentList '/c','npm run dev -- -p %FRONTEND_PORT%' -WorkingDirectory (Get-Location) -RedirectStandardOutput 'logs\frontend.log' -RedirectStandardError 'logs\frontend-error.log'"

REM ---- Wait until the frontend answers, then open the browser ---------
echo  Waiting for the app to be ready (up to 3 minutes)...
powershell -NoProfile -Command "$deadline=(Get-Date).AddMinutes(3); while((Get-Date) -lt $deadline){ try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 '%APP_URL%' | Out-Null; exit 0 } catch { Start-Sleep -Seconds 2 } }; exit 1"
if errorlevel 1 (
    echo  [!] The app did not start in time. Check logs\frontend-error.log and logs\backend-error.log
    pause
    exit /b 1
)

start "" "%APP_URL%"
echo.
echo  CloudShift AI is running:
echo    Frontend : %APP_URL%
echo    Backend  : http://localhost:%BACKEND_PORT%/docs
echo  To stop it, double-click "Stop CloudShift.bat".
timeout /t 4 >nul
exit /b 0
