@echo off
cd /d "%~dp0"
title DevMind Backend Server

echo [BACKEND] 1. Checking Environment...

if not exist "venv\Scripts\python.exe" (
    echo [BACKEND] Virtual environment missing. Creating...
    python -m venv venv
)

set "PATH=%~dp0venv\Scripts;%PATH%"

echo [BACKEND] 2. Checking Dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b
)

echo [BACKEND] 3. Starting Uvicorn...
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

if %errorlevel% neq 0 pause