#!/bin/bash

# Function to kill backend when script exits
cleanup() {
    echo "🛑 Shutting down..."
    kill $BACKEND_PID
    exit
}

trap cleanup SIGINT

echo "🚀 Starting DevMind-AI..."

# --- 1. CHECK FOR .ENV ---
if [ ! -f "backend/.env" ]; then
    echo "⚠️  .env file not found in backend!"
    echo "📄 Creating backend/.env for you..."
    echo "GEMINI_API_KEY=" > backend/.env
    echo ""
    echo "🛑 ACTION REQUIRED: Please open 'backend/.env' and paste your API Key."
    echo "   Then run this script again."
    exit 1
fi

# --- 2. SETUP BACKEND (Inside backend folder) ---
cd backend

# Setup Python Venv if missing
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment in backend/venv..."
    python3 -m venv venv
fi

# Install Dependencies
echo "⬇️  Checking Python dependencies..."
./venv/bin/pip install -r requirements.txt

echo "🐍 Launching Backend..."
# Force use of venv python
./venv/bin/python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# --- 3. START FRONTEND (Back to Root) ---
cd ..
echo "⚛️  Launching Frontend..."

# Install Node Modules if missing
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm packages..."
    npm install
fi

npm run dev

# Keep script running to maintain background processes
wait