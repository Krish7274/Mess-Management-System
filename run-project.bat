@echo off
title Mess Management System Runner

echo ========================================
echo Starting Mess Management System...
echo ========================================

:: ---- START BACKEND ----
start cmd /k "cd backend && call .venv\Scripts\activate && python app.py"

:: Wait 3 seconds to allow backend to start
timeout /t 3 /nobreak >nul

:: ---- START FRONTEND ----
start cmd /k "cd frontend && npm run dev"

:: Wait 3 seconds
timeout /t 3 /nobreak >nul

:: ---- OPEN BROWSER ----
start http://localhost:5173

echo ========================================
echo Project Started Successfully!
echo ========================================
pause