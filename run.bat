@echo off
setlocal
cd /d "%~dp0"
title DevMind-AI Launcher

echo [INFO] Starting DevMind-AI Stack...

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed! Please install it from python.org.
    pause
    exit /b
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    if not exist "node_bin\npm.cmd" (
        echo [INFO] Node.js not found. Downloading portable version...
        if not exist "node_bin" mkdir node_bin
        
        echo [INFO] Downloading Node.js v20 (Please wait)...
        powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip' -OutFile 'node.zip'"
        
        echo [INFO] Extracting Node.js...
        tar -xf node.zip --strip-components=1 -C node_bin
        del node.zip
    )
    set "PATH=%~dp0node_bin;%PATH%"
    echo [INFO] Using Portable Node.js.
)

if not exist backend\.env (
    echo [WARNING] .env file missing in backend!
    echo [INFO] Creating empty .env file...
    echo GEMINI_API_KEY= > backend\.env
    echo.
    echo [ACTION REQUIRED] Open 'backend\.env' and paste your API Key.
    echo Then run this script again.
    pause
    exit /b
)

echo [INFO] Launching Backend Window...
start "DevMind Backend" cmd /k "backend\run_backend.bat"

echo [INFO] Launching Frontend...

if not exist package.json (
    echo [ERROR] package.json not found in root!
    pause
    exit /b
)

if not exist node_modules (
    echo [INFO] Installing npm packages...
    call npm install
)

call npm run dev