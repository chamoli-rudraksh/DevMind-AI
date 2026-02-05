@echo off
cd /d "%~dp0"
title DevMind Backend Server

echo [BACKEND] 1. Checking Environment...

:: FIX: Check if the python executable actually exists. 
:: If the folder 'venv' exists but is empty, this will catch it.
if not exist "venv\Scripts\python.exe" (
    echo [BACKEND] Virtual environment missing or broken.
    echo [BACKEND] Creating a fresh one...
    
    :: If a broken folder exists, delete it first
    if exist venv rmdir /s /q venv
    
    python -m venv venv
)

echo [BACKEND] 2. Checking Dependencies...
:: We check if pip worked; if not, we pause to see the error
.\venv\Scripts\pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b
)

echo [BACKEND] 3. Starting Uvicorn...
.\venv\Scripts\python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

:: Keep window open if it crashes
if %errorlevel% neq 0 pause