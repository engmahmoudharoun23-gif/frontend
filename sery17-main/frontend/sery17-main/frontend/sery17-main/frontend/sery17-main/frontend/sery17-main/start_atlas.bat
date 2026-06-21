@echo off
echo Starting WFM System with ATLAS Cloud Database (14 users)...

REM بدء السيرفر الخلفي
start "Backend (Atlas)" cmd /k "cd backend && venv\Scripts\activate && uvicorn server:app --host 0.0.0.0 --port 8001 --reload"

REM الانتظار قليلاً للتأكد من تشغيل الباك اند
ping 127.0.0.1 -n 4 > NUL

REM بدء الواجهة الأمامية
start "Frontend (Atlas)" cmd /k "cd frontend && set DANGEROUSLY_DISABLE_HOST_CHECK=true && npm start"
