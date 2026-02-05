#!/bin/bash

# Function to kill backend when script exits
cleanup() {
    echo "🛑 Shutting down..."
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    exit
}

trap cleanup SIGINT

echo "🚀 Starting DevMind-AI..."

# --- 1. CHECK PREREQUISITES ---

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "❌ [ERROR] Python3 is not installed!"
    echo "👉 Please install it using: sudo apt install python3"
    exit 1
fi

# Check for Node.js (Auto-download if missing)
if ! command -v npm &> /dev/null; then
    if [ -f "./node_bin/bin/node" ]; then
        echo "✅ Found portable Node.js."
        export PATH="$PWD/node_bin/bin:$PATH"
    else
        echo "⚠️  Node.js not found. Downloading portable version (Linux x64)..."
        mkdir -p node_bin
        wget -qO node.tar.xz https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.xz || curl -o node.tar.xz https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.xz
        
        echo "📂 Extracting Node.js..."
        tar -xf node.tar.xz --strip-components=1 -C node_bin
        rm node.tar.xz
        
        export PATH="$PWD/node_bin/bin:$PATH"
        echo "✅ Node.js installed locally!"
    fi
else
    if [ -d "./node_bin/bin" ]; then
        export PATH="$PWD/node_bin/bin:$PATH"
    fi
fi

# --- 2. CHECK FOR .ENV ---
if [ ! -f "backend/.env" ]; then
    echo "⚠️  [WARNING] .env file not found in backend!"
    echo "📄 Creating backend/.env for you..."
    echo "GEMINI_API_KEY=" > backend/.env
    echo ""
    echo "🛑 [ACTION REQUIRED] Please open 'backend/.env' and paste your API Key."
    echo "   Then run this script again."
    exit 1
fi

# --- 3. START BACKEND (Background Process) ---
echo "🐍 Launching Backend Server..."

cd backend

# Setup Python Venv if missing
if [ ! -f "venv/bin/python" ]; then
    echo "📦 Creating virtual environment..."
    if [ -d "venv" ]; then rm -rf venv; fi
    python3 -m venv venv
fi

# Install Dependencies
echo "⬇️  Checking Python dependencies..."
./venv/bin/python -m pip install --upgrade pip
./venv/bin/pip install -r requirements.txt

# Start Uvicorn in background
# FIX: Removed --reload-exclude because workspace_data is now outside this folder
./venv/bin/python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# --- 4. START FRONTEND ---
cd ..
echo "⚛️  Launching Frontend..."

if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm packages..."
    npm install
fi

npm run dev

# Keep script running
wait