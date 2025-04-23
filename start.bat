@echo off
setlocal

echo Starting TMS application...
start cmd /k "npm start"

echo Waiting all services to start...
:waitLoop
timeout /t 2 > nul
curl -s http://localhost:8000 > nul 2>&1
if errorlevel 1 (
    goto waitLoop
)

start http://localhost:3000