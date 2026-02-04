@echo off
echo 🚀 Setting up DevMind-AI...

cd backend

:: 1. Check for .env
if not exist .env (
    echo GEMINI_API_KEY=PASTE_YOUR_KEY_HERE > .env
    echo ❌ .env file missing! Created one for you.
    echo ⚠️ Please open backend/.env and add your API KEY.
    pause
    exit
)

:: 2. Create Venv
if not exist venv (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

:: 3. Activate & Install
call venv\Scripts\activate
echo ⬇️ Installing dependencies...
pip install -r requirements.txt

:: 4. Run Server
echo ✅ Starting Server...
uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause