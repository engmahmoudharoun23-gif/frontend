# دليل ربط الأجهزة باللاب توب الرئيسي - نظام WFM

## 🌐 نظرة عامة

هذا الدليل يوضح كيفية تشغيل النظام على لاب توب رئيسي واحد والسماح لجميع المراقبين بالاتصال من أجهزتهم.

### البنية:
```
┌──────────────────────────────────────────┐
│      اللاب توب الرئيسي (Server)          │
│  ├─ MongoDB                             │
│  ├─ Backend (Port 8001)                 │
│  └─ Frontend (Port 3000)                │
└──────────────────────────────────────────┘
           │
           │ شبكة محلية (WiFi/LAN)
           │
    ┌──────┴──────┬──────────┬──────────┐
    │             │          │          │
┌───┴───┐   ┌────┴────┐ ┌───┴────┐ ┌───┴────┐
│ جهاز 1 │   │ جهاز 2  │ │ جهاز 3 │ │ جهاز 4  │
│(مراقب)│   │ (مراقب) │ │(مراقب) │ │ (مراقب) │
└───────┘   └─────────┘ └────────┘ └────────┘
```

---

## 📍 الجزء الأول: إعداد اللاب توب الرئيسي (Server)

### الخطوة 1: تثبيت المتطلبات

#### 1.1 تثبيت Python 3.11+
```bash
# Windows
# حمّل من: https://www.python.org/downloads/
# تأكد من تحديد "Add Python to PATH"

# Linux
sudo apt install python3.11 python3.11-venv
```

#### 1.2 تثبيت Node.js 18+
```bash
# Windows
# حمّل من: https://nodejs.org/

# Linux
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 1.3 تثبيت MongoDB
```bash
# Windows
# حمّل من: https://www.mongodb.com/try/download/community
# ثبت واختر "Complete Installation"

# Linux
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### الخطوة 2: معرفة IP اللاب توب الرئيسي

#### Windows:
```cmd
ipconfig
```
ابحث عن **"IPv4 Address"** - مثال: `192.168.1.100`

#### Linux:
```bash
ip addr show
# أو
hostname -I
```

**احفظ هذا الـ IP! سنحتاجه لاحقاً. مثال: `192.168.1.100`**

### الخطوة 3: إعداد Backend

```bash
# انتقل إلى مجلد Backend
cd /path/to/backend

# إنشاء بيئة افتراضية
python -m venv venv

# تفعيل البيئة
# Windows
venv\Scripts\activate
# Linux
source venv/bin/activate

# تثبيت المكتبات
pip install -r requirements.txt

# إنشاء مجلد uploads
mkdir uploads
```

### الخطوة 4: إعداد ملف .env للـ Backend

أنشئ/عدّل ملف `.env` في مجلد `backend`:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=wfm_reports
CORS_ORIGINS=*
SECRET_KEY=your-secret-key-change-this-in-production
EMERGENT_LLM_KEY=sk-emergent-58bF9EcFc97960f7a2
```

**ملاحظة مهمة:** `CORS_ORIGINS=*` يسمح لجميع الأجهزة بالاتصال

### الخطوة 5: إنشاء مستخدم مسؤول

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
    
    await db.users.delete_one({"username": "admin"})
    
    admin = {
        "id": str(uuid.uuid4()),
        "username": "admin",
        "email": "admin@wfm.com",
        "full_name": "المسؤول الرئيسي",
        "role": "admin",
        "governorates": [],  # فارغ = وصول لكل المحافظات
        "hashed_password": pwd_context.hash("admin123"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True
    }
    
    await db.users.insert_one(admin)
    print("✅ تم إنشاء حساب المسؤول")
    print("   اسم المستخدم: admin")
    print("   كلمة المرور: admin123")
    client.close()

asyncio.run(create_admin())
EOF
```

### الخطوة 6: تشغيل Backend

```bash
# في مجلد backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**ملاحظة:** `--host 0.0.0.0` مهم جداً للسماح بالاتصالات من أجهزة أخرى!

### الخطوة 7: إعداد Frontend

```bash
# في نافذة/terminal جديدة
cd /path/to/frontend

# تثبيت المكتبات
yarn install
# أو
npm install
```

### الخطوة 8: إعداد .env للـ Frontend

**احذر!** استخدم IP اللاب توب الرئيسي الذي حصلت عليه في الخطوة 2!

أنشئ/عدّل ملف `.env` في مجلد `frontend`:

```env
REACT_APP_BACKEND_URL=http://192.168.1.100:8001
```

**استبدل `192.168.1.100` بـ IP جهازك الفعلي!**

### الخطوة 9: تشغيل Frontend

```bash
# في مجلد frontend
DANGEROUSLY_DISABLE_HOST_CHECK=true yarn start
# أو
DANGEROUSLY_DISABLE_HOST_CHECK=true npm start
```

**Windows (PowerShell):**
```powershell
$env:DANGEROUSLY_DISABLE_HOST_CHECK="true"
yarn start
```

---

## 🔥 الجزء الثاني: فتح Firewall على اللاب توب الرئيسي

### Windows:

#### الطريقة 1: عبر الواجهة الرسومية

1. افتح **Windows Defender Firewall**
2. اضغط **Advanced Settings**
3. اضغط **Inbound Rules**
4. اضغط **New Rule**
5. اختر **Port** → Next
6. اختر **TCP** وأدخل المنافذ: **3000, 8001**
7. اختر **Allow the connection**
8. حدد جميع الشبكات (Domain, Private, Public)
9. أعط القاعدة اسماً: **WFM System**

#### الطريقة 2: عبر Command Prompt (كمسؤول)

```cmd
netsh advfirewall firewall add rule name="WFM Backend" dir=in action=allow protocol=TCP localport=8001
netsh advfirewall firewall add rule name="WFM Frontend" dir=in action=allow protocol=TCP localport=3000
```

### Linux:

```bash
# UFW
sudo ufw allow 8001/tcp
sudo ufw allow 3000/tcp
sudo ufw reload

# firewalld
sudo firewall-cmd --permanent --add-port=8001/tcp
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

---

## 📱 الجزء الثالث: ربط أجهزة المراقبين

### على كل جهاز مراقب:

#### الطريقة 1: استخدام المتصفح مباشرة (الأسهل)

1. افتح أي متصفح (Chrome, Firefox, Edge)
2. اذهب إلى: `http://192.168.1.100:3000`
   
   **استبدل `192.168.1.100` بـ IP اللاب توب الرئيسي!**

3. سجل الدخول باستخدام:
   - اسم المستخدم وكلمة المرور الخاصة بالمراقب

4. **اختياري:** احفظ الصفحة كـ Bookmark أو اضغط **Ctrl+D**

#### الطريقة 2: إنشاء اختصار على سطح المكتب

**Windows:**
1. اضغط كليك يمين على سطح المكتب
2. اختر **New → Shortcut**
3. أدخل: `http://192.168.1.100:3000`
4. سمه: **نظام إدارة البلاغات**

**اختياري:** لجعله يشبه تطبيقاً:
- انسخ أيقونة من الإنترنت
- كليك يمين على الاختصار → Properties
- Change Icon → اختر أيقونة

---

## 👥 إضافة مستخدمين للمراقبين

### على اللاب توب الرئيسي:

1. سجل الدخول كـ **admin**
2. اذهب إلى **إدارة المستخدمين**
3. اضغط **+ إضافة مستخدم**
4. املأ البيانات:
   - اسم المستخدم: `dawadmi_user`
   - البريد: `dawadmi@wfm.com`
   - الاسم الكامل: `مراقب الدوادمي`
   - كلمة المرور: `123456`
   - الدور: **مستخدم**
   - **اختر المحافظة:** الدوادمي فقط ✅
5. اضغط **حفظ**

**الآن هذا المستخدم:**
- ✅ يمكنه إضافة بلاغات للدوادمي فقط
- ✅ يرى بلاغات الدوادمي فقط
- ❌ لا يمكنه رؤية أو تعديل بلاغات محافظات أخرى

**كرر هذا لكل محافظة!**

---

## 🔄 جعل النظام يعمل تلقائياً عند بدء التشغيل

### Windows:

#### 1. إنشاء ملف Batch

أنشئ ملف `start_wfm.bat` على سطح المكتب:

```batch
@echo off
echo Starting WFM Report Management System...

REM بدء MongoDB
net start MongoDB

REM الانتظار قليلاً
timeout /t 5

REM بدء Backend
start /B "WFM Backend" cmd /c "cd C:\path\to\backend && venv\Scripts\activate && uvicorn server:app --host 0.0.0.0 --port 8001"

REM الانتظار
timeout /t 10

REM بدء Frontend
start /B "WFM Frontend" cmd /c "cd C:\path\to\frontend && set DANGEROUSLY_DISABLE_HOST_CHECK=true && yarn start"

echo WFM System Started!
echo Backend: http://localhost:8001
echo Frontend: http://localhost:3000
pause
```

#### 2. جعله يعمل تلقائياً:

1. اضغط **Win+R**
2. اكتب: `shell:startup`
3. انسخ `start_wfm.bat` إلى المجلد الذي فتح

### Linux:

أنشئ systemd service:

```bash
sudo nano /etc/systemd/system/wfm-backend.service
```

```ini
[Unit]
Description=WFM Backend Service
After=network.target mongodb.service

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/backend
Environment="PATH=/path/to/backend/venv/bin"
ExecStart=/path/to/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable wfm-backend
sudo systemctl start wfm-backend
```

كرر نفس الشيء للـ Frontend.

---

## 🧪 اختبار الاتصال

### من أي جهاز في الشبكة:

```bash
# اختبار Backend
curl http://192.168.1.100:8001/api/health

# يجب أن يرجع:
# {"status":"healthy"}
```

### من المتصفح:

1. افتح: `http://192.168.1.100:8001/docs`
2. يجب أن ترى صفحة Swagger API

---

## 🔒 الأمان

### نصائح مهمة:

1. **غيّر كلمات المرور الافتراضية!**
2. **استخدم SECRET_KEY قوي** في `.env`
3. **لا تستخدم النظام على شبكة عامة/مفتوحة**
4. **استخدم VPN** إذا كنت تريد الوصول من خارج الشبكة المحلية

### تأمين إضافي (اختياري):

```env
# في .env للـ Backend
CORS_ORIGINS=http://192.168.1.100:3000,http://192.168.1.101:3000
# أضف IPs الأجهزة المصرح بها فقط
```

---

## 📊 مراقبة النظام

### معرفة الأجهزة المتصلة:

**Windows (PowerShell كمسؤول):**
```powershell
netstat -an | findstr "8001\|3000"
```

**Linux:**
```bash
sudo netstat -tlnp | grep -E '8001|3000'
```

---

## ❗ استكشاف الأخطاء

### المراقب لا يستطيع الاتصال:

1. **تحقق من الشبكة:**
   ```bash
   ping 192.168.1.100
   ```
   
2. **تحقق من Firewall:**
   - تأكد أن المنافذ 3000 و 8001 مفتوحة
   
3. **تحقق من أن الخوادم تعمل:**
   ```bash
   # على اللاب توب الرئيسي
   curl http://localhost:8001/api/health
   curl http://localhost:3000
   ```

4. **تحقق من IP:**
   - تأكد أن الأجهزة على نفس الشبكة
   - IP قد يتغير عند إعادة تشغيل Router

### حل مشكلة تغيير IP:

**اجعل IP ثابت:**

#### Windows:
1. Control Panel → Network Connections
2. كليك يمين على اتصال الشبكة → Properties
3. اختر IPv4 → Properties
4. اختر "Use the following IP address"
5. أدخل IP ثابت (مثال: 192.168.1.100)

#### Linux:
```bash
# Ubuntu/Netplan
sudo nano /etc/netplan/01-netcfg.yaml
```

```yaml
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: no
      addresses: [192.168.1.100/24]
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
```

```bash
sudo netplan apply
```

---

## 📦 النسخ الاحتياطي

### نسخ احتياطي لقاعدة البيانات (يومياً):

```bash
# Windows
mongodump --db wfm_reports --out C:\backup\%date:~-4,4%%date:~-7,2%%date:~-10,2%

# Linux
mongodump --db wfm_reports --out /backup/$(date +%Y%m%d)
```

---

## 📝 ملخص سريع

**على اللاب توب الرئيسي:**
1. ✅ شغّل MongoDB
2. ✅ شغّل Backend على `0.0.0.0:8001`
3. ✅ شغّل Frontend
4. ✅ افتح Firewall للمنافذ 3000 و 8001
5. ✅ أنشئ مستخدمين للمراقبين مع تحديد المحافظات

**على أجهزة المراقبين:**
1. ✅ افتح المتصفح
2. ✅ اذهب إلى `http://IP_SERVER:3000`
3. ✅ سجل الدخول
4. ✅ ابدأ العمل!

---

**مبروك! النظام الآن يعمل على الشبكة المحلية! 🎉**

جميع البلاغات التي يضيفها المراقبون ستظهر فوراً على اللاب توب الرئيسي وعلى جميع الأجهزة المتصلة!
