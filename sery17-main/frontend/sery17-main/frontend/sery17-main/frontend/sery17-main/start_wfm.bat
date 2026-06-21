@echo off
echo Starting WFM Report Management System...

REM بدء MongoDB
net start MongoDB

REM الانتظار قليلاً
timeout /t 5

REM بدء Backend
start "WFM Backend" cmd /c "d: && cd d:\sery17-main\sery17-main\backend && venv\Scripts\activate && uvicorn server:app --host 0.0.0.0 --port 8001"

REM الانتظار
timeout /t 5

REM بدء Frontend
start "WFM Frontend" cmd /c "d: && cd d:\sery17-main\sery17-main\frontend && set DANGEROUSLY_DISABLE_HOST_CHECK=true && npm start"

echo WFM System Started!
echo Backend: http://localhost:8001
echo Frontend: http://localhost:3000
