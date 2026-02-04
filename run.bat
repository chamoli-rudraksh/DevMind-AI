@echo off
echo 🚀 Starting DevMind-AI Stack...

:: 1. Start Backend in a NEW Window
:: We go into 'backend', check for venv, install requirements, and then force
:: the venv's python to run uvicorn.
echo 🐍 Launching Backend Server...
start "DevMind Backend" cmd /k "cd backend & if not exist venv (python -m venv venv) & .\venv\Scripts\pip install -r requirements.txt & .\venv\Scripts\python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: 2. Start Frontend in THIS Window (Root)
echo ⚛️  Launching Frontend...

if not exist node_modules (
    echo 📦 Installing npm packages...
    call npm install
)

npm run dev