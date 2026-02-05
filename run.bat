@echo off
setlocal
cd /d "%~dp0"

echo [INFO] Starting DevMind-AI Stack...

:: --- 1. CHECK PREREQUISITES ---
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed! Install it from python.org.
    pause
    exit /b
)

:: Check for Node.js (Auto-download if missing)
where npm >nul 2>nul
if %errorlevel% neq 0 (
    if not exist "node_bin\npm.cmd" (
        echo [INFO] Node.js missing. Downloading portable version...
        if not exist "node_bin" mkdir node_bin
        powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.zip' -OutFile 'node.zip'"
        tar -xf node.zip --strip-components=1 -C node_bin
        del node.zip
    )
    set "PATH=%CD%\node_bin;%PATH%"
)

:: --- 2. CHECK FOR .ENV ---
if not exist backend\.env (
    echo [WARNING] .env file missing in backend.
    echo GEMINI_API_KEY= > backend\.env
    echo [ACTION REQUIRED] Open 'backend\.env' and paste your API Key.
    pause
    exit /b
)

:: --- 3. START BACKEND ---
echo [INFO] Launching Backend Window...
:: This is the fix: We just launch the file we created in Step 1
start "DevMind Backend" "backend\run_backend.bat"

:: --- 4. START FRONTEND ---
echo [INFO] Launching Frontend...
if exist "node_bin" set "PATH=%CD%\node_bin;%PATH%"

if not exist node_modules (
    echo [INFO] Installing npm packages...
    call npm install
)

call npm run dev