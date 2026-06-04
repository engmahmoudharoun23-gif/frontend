@echo off
echo Starting WFM Report Management System...

REM بدء MongoDB باستخدام قاعدة البيانات الأصلية
start "MongoDB" "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath C:\data\db

REM الانتظار قليلاً للتأكد من تشغيل قاعدة البيانات
ping 127.0.0.1 -n 4 > NUL

REM بدء السيرفر الخلفي
start "Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn server:app --host 0.0.0.0 --port 8001 --reload"

REM بدء الواجهة الأمامية (ستفتح المتصفح تلقائياً)
start "Frontend" cmd /k "cd frontend && set DANGEROUSLY_DISABLE_HOST_CHECK=true && npm start"
