@echo off
cd /d "%~dp0"
title DevMind Backend Server

echo [BACKEND] 1. Checking Environment...

if not exist "venv\Scripts\python.exe" (
    echo [BACKEND] Virtual environment missing or broken.
    echo [BACKEND] Creating a fresh one...
    if exist venv rmdir /s /q venv
    python -m venv venv
)

echo [BACKEND] 2. Checking Dependencies...
.\venv\Scripts\python.exe -m pip install --upgrade pip
.\venv\Scripts\pip install -r requirements.txt

echo [BACKEND] 3. Starting Uvicorn...
:: FIX: No exclude needed because data is now outside the folder!
.\venv\Scripts\python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

if %errorlevel% neq 0 pause