# run_app.ps1
# Script to run both backend and frontend for the Interview Preparation Assistant

Write-Host "Starting Interview Preparation Assistant..." -ForegroundColor Cyan

# 1. Start Backend in a new window
Write-Host "--> Starting Backend on http://localhost:8080" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PSScriptRoot; .\venv\Scripts\python.exe main.py"

# 2. Start Frontend in a new window
Write-Host "--> Starting Frontend on http://localhost:5173" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $PSScriptRoot\frontend; npm run dev"

Write-Host "=====================================================" -ForegroundColor Green
Write-Host "Both services are starting in separate windows." -ForegroundColor Green
Write-Host "1. Backend: http://localhost:8080" -ForegroundColor Green
Write-Host "2. Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "Note: Please ensure your GEMINI_API_KEY is set correctly in your environment." -ForegroundColor Magenta
