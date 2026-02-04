@echo off
echo 🚀 Starting DevMind-AI Stack...

:: --- 1. CHECK FOR .ENV ---
if not exist backend\.env (
    echo ⚠️  .env file not found in backend!
    echo 📄 Creating backend\.env for you...
    echo GEMINI_API_KEY= > backend\.env
    echo.
    echo 🛑 ACTION REQUIRED: Please open 'backend\.env' and paste your API Key.
    echo    Once you have saved the file, run this script again.
    pause
    exit
)

:: --- 2. START BACKEND (New Window) ---
echo 🐍 Launching Backend Server...
:: We use 'start' to open a new window.
:: It goes into 'backend', creates venv if needed, installs reqs, and runs uvicorn.
start "DevMind Backend" cmd /k "cd backend & if not exist venv (python -m venv venv) & .\venv\Scripts\pip install -r requirements.txt & .\venv\Scripts\python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: --- 3. START FRONTEND (Current Window) ---
echo ⚛️  Launching Frontend...

if not exist node_modules (
    echo 📦 Installing npm packages...
    call npm install
)

npm run dev