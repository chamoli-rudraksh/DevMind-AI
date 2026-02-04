#!/bin/bash

# Function to kill backend when script exits
cleanup() {
    echo "🛑 Shutting down..."
    kill $BACKEND_PID
    exit
}

# Trap Ctrl+C to run cleanup
trap cleanup SIGINT

echo "🚀 Starting DevMind-AI..."

# 1. Go into backend folder
cd backend

# 2. Setup Python Environment (if missing)
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# 3. Install Dependencies (Quietly)
echo "⬇️  Checking dependencies..."
./venv/bin/pip install -r requirements.txt

echo "🐍 Launching Backend..."
# ✅ THE FIX: We explicitly call the python inside the venv
# instead of relying on the shell 'activate' command.
./venv/bin/python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 4. Start Frontend (Go back to Root)
cd ..
echo "⚛️  Launching Frontend..."
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm packages..."
    npm install
fi

npm run dev

# Wait for background processes
wait