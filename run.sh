#!/bin/bash

echo "🚀 Setting up DevMind-AI..."

# 1. Navigate to backend
cd backend

# 2. Check if .env exists, if not create a dummy one
if [ ! -f .env ]; then
    echo "⚠️  .env file missing! Creating one..."
    echo "GEMINI_API_KEY=PASTE_YOUR_KEY_HERE" > .env
    echo "❌ Please open backend/.env and paste your API Key!"
    exit 1
fi

# 3. Create Virtual Environment (if not exists)
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# 4. Activate & Install
source venv/bin/activate
echo "⬇️  Installing dependencies..."
pip install -r requirements.txt

# 5. Run Server
echo "✅ Starting Server..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000