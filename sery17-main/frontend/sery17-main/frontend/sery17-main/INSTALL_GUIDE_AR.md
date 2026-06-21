# دليل التثبيت والتشغيل المحلي - نظام إدارة البلاغات WFM

## 📥 التثبيت على اللاب توب (بدون سيرفر)

### المتطلبات الأساسية

#### 1. تثبيت Python 3.11
**Windows:**
- حمّل من: https://www.python.org/downloads/
- تأكد من تحديد "Add Python to PATH" أثناء التثبيت

**Linux/Mac:**
```bash
# Ubuntu/Debian
sudo apt install python3.11 python3.11-venv

# Mac
brew install python@3.11
```

#### 2. تثبيت Node.js 18+
**Windows:**
- حمّل من: https://nodejs.org/

**Linux:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Mac:**
```bash
brew install node
```

#### 3. تثبيت MongoDB
**Windows:**
- حمّل MongoDB Community من: https://www.mongodb.com/try/download/community
- ثبت واختر "Complete Installation"
- MongoDB سيعمل تلقائياً كـ Service

**Linux:**
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Mac:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

---

## 🚀 خطوات التشغيل

### الخطوة 1: تحميل الكود

```bash
# إذا كان لديك git
git clone <repository-url>
cd notification-hub-wfm

# أو قم بتحميل وفك ضغط ملف ZIP
```

### الخطوة 2: إعداد Backend

```bash
# الذهاب إلى مجلد Backend
cd backend

# إنشاء بيئة افتراضية
python -m venv venv

# تفعيل البيئة الافتراضية
# Windows (CMD)
venv\Scripts\activate
# Windows (PowerShell)
venv\Scripts\Activate.ps1
# Linux/Mac
source venv/bin/activate

# تثبيت المكتبات المطلوبة
pip install --upgrade pip
pip install -r requirements.txt

# إنشاء مجلد uploads
mkdir uploads
```

### الخطوة 3: إعداد ملف .env للـ Backend

أنشئ ملف `.env` في مجلد `backend` بالمحتوى التالي:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=wfm_reports
CORS_ORIGINS=http://localhost:3000
SECRET_KEY=your-secret-key-change-this
EMERGENT_LLM_KEY=sk-emergent-58bF9EcFc97960f7a2
```

### الخطوة 4: إنشاء مستخدم مسؤول

```bash
# داخل مجلد backend مع البيئة الافتراضية مفعلة
python << 'EOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    # حذف المستخدم إذا كان موجوداً
    await db.users.delete_one({"username": "admin"})
    
    admin = {
        "id": str(uuid.uuid4()),
        "username": "admin",
        "email": "admin@wfm.com",
        "full_name": "المسؤول",
        "role": "admin",
        "governorates": [],  # فارغ = الوصول لكل المحافظات
        "hashed_password": pwd_context.hash("admin123"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True
    }
    
    await db.users.insert_one(admin)
    print("✅ تم إنشاء حساب المسؤول:")
    print("   اسم المستخدم: admin")
    print("   كلمة المرور: admin123")
    client.close()

asyncio.run(create_admin())
EOF
```

### الخطوة 5: تشغيل Backend

```bash
# في مجلد backend مع البيئة الافتراضية مفعلة
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

يجب أن ترى:
```
INFO:     Uvicorn running on http://0.0.0.0:8001
INFO:     Application startup complete.
```

### الخطوة 6: إعداد Frontend (نافذة جديدة/Terminal جديد)

```bash
# الذهاب إلى مجلد frontend
cd frontend

# تثبيت المكتبات
yarn install
# أو
npm install
```

### الخطوة 7: إعداد ملف .env للـ Frontend

أنشئ/عدّل ملف `.env` في مجلد `frontend`:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### الخطوة 8: تشغيل Frontend

```bash
# في مجلد frontend
yarn start
# أو
npm start
```

المتصفح سيفتح تلقائياً على: http://localhost:3000

---

## 🖥️ تحويل النظام إلى تطبيق (Desktop App)

### باستخدام Electron

#### 1. إنشاء نسخة Production للـ Frontend

```bash
cd frontend
yarn build
# أو
npm run build
```

#### 2. تثبيت Electron

```bash
npm install -g electron-packager
```

#### 3. إنشاء ملف electron.js

أنشئ ملف `electron.js` في مجلد frontend:

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess = null;
let mainWindow = null;

function startBackend() {
  // تشغيل Backend
  const pythonPath = process.platform === 'win32' ? 'python' : 'python3';
  backendProcess = spawn(pythonPath, [
    '-m', 'uvicorn',
    'server:app',
    '--host', '0.0.0.0',
    '--port', '8001'
  ], {
    cwd: path.join(__dirname, '..', 'backend')
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // تحميل التطبيق
  mainWindow.loadFile('build/index.html');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  startBackend();
  setTimeout(createWindow, 3000); // انتظار Backend
});

app.on('window-all-closed', function () {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
```

#### 4. إضافة إلى package.json

```json
{
  "main": "electron.js",
  "scripts": {
    "electron": "electron .",
    "pack": "electron-packager . WFM-Reports --platform=win32 --arch=x64 --out=dist"
  }
}
```

#### 5. تثبيت Electron محلياً

```bash
npm install electron --save-dev
```

#### 6. تشغيل التطبيق

```bash
npm run electron
```

#### 7. إنشاء ملف تنفيذي .exe

```bash
npm run pack
```

الملف التنفيذي سيكون في: `dist/WFM-Reports-win32-x64/WFM-Reports.exe`

---

## 📦 توزيع التطبيق

### إنشاء حزمة كاملة قابلة للتوزيع

1. **إنشاء مجلد للتوزيع:**
```
WFM-Distribution/
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   ├── .env
│   └── uploads/
├── WFM-Reports.exe
├── mongod.exe (نسخة portable من MongoDB)
├── start.bat
└── README.txt
```

2. **ملف start.bat:**
```batch
@echo off
echo Starting WFM Report Management System...

REM بدء MongoDB
start /B mongod.exe --dbpath data

REM الانتظار قليلاً
timeout /t 3

REM بدء التطبيق
WFM-Reports.exe
```

---

## 🔧 استكشاف الأخطاء

### Backend لا يبدأ

```bash
# تحقق من المنفذ
netstat -ano | findstr :8001

# إيقاف العملية إذا كان المنفذ مستخدماً
# Windows
taskkill /PID <process_id> /F
# Linux/Mac
kill -9 <process_id>
```

### MongoDB لا يعمل

**Windows:**
```cmd
net start MongoDB
```

**Linux/Mac:**
```bash
sudo systemctl start mongod
# أو
brew services start mongodb-community
```

### خطأ في تثبيت المكتبات

```bash
# تحديث pip
pip install --upgrade pip

# تثبيت مكتبة واحدة في كل مرة
pip install fastapi
pip install motor
# ... إلخ
```

---

## 💾 النسخ الاحتياطي

### نسخ احتياطي لقاعدة البيانات

```bash
# تصدير
mongodump --db wfm_reports --out backup/

# استيراد
mongorestore --db wfm_reports backup/wfm_reports/
```

### نسخ احتياطي للصور

```bash
# نسخ مجلد uploads
cp -r backend/uploads backup/uploads_$(date +%Y%m%d)
```

---

## 🌐 الوصول من أجهزة أخرى في الشبكة المحلية

### 1. معرفة IP الخاص بك

**Windows:**
```cmd
ipconfig
```
ابحث عن "IPv4 Address"

**Linux/Mac:**
```bash
ifconfig
```
أو
```bash
ip addr show
```

### 2. تحديث .env في Frontend

```env
REACT_APP_BACKEND_URL=http://<YOUR_IP>:8001
```

### 3. تشغيل Backend للسماح بالاتصالات الخارجية

```bash
uvicorn server:app --host 0.0.0.0 --port 8001
```

### 4. فتح المنافذ في Firewall

**Windows:**
```
Control Panel > Windows Defender Firewall > Advanced Settings
> Inbound Rules > New Rule > Port > 8001, 3000
```

---

## ✅ قائمة التحقق

- [ ] Python 3.11 مثبت
- [ ] Node.js مثبت
- [ ] MongoDB مثبت ويعمل
- [ ] تم تثبيت مكتبات Backend
- [ ] تم تثبيت مكتبات Frontend
- [ ] تم إنشاء مستخدم admin
- [ ] Backend يعمل على المنفذ 8001
- [ ] Frontend يعمل على المنفذ 3000
- [ ] يمكن تسجيل الدخول بنجاح

---

## 📞 الدعم

إذا واجهت أي مشاكل، تحقق من:
1. جميع الخدمات تعمل (MongoDB, Backend, Frontend)
2. المنافذ غير مستخدمة من برامج أخرى
3. ملفات .env تحتوي على القيم الصحيحة
4. Firewall لا يحجب الاتصالات

---

**مبروك! النظام جاهز للاستخدام على اللاب توب! 🎉**
