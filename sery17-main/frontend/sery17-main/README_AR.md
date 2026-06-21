# نظام إدارة البلاغات WFM

نظام شامل لإدارة بلاغات الصيانة مع ميزات الذكاء الاصطناعي

## 🚀 المميزات

### 1. إدارة البلاغات الشاملة
- ✅ إضافة بلاغ جديد مع كافة التفاصيل
- ✅ تعديل وحذف البلاغات
- ✅ رفع صور البلاغات (PDF, JPG)
- ✅ سلة محذوفات مع إمكانية الاسترداد

### 2. البحث والفلترة المتقدمة
- 🔍 البحث برقم البلاغ أو رقم الرخصة
- 🔍 الفلترة حسب: المحافظة، نوع البلاغ، الحالة
- 🔍 الفلترة حسب التاريخ (من - إلى)

### 3. التصدير والتقارير
- 📊 تصدير إلى Excel
- 📄 تصدير إلى PDF
- 📈 لوحة تحكم بالإحصائيات

### 4. الذكاء الاصطناعي
- 🤖 تحليل ذكي للبلاغات باستخدام GPT-4o-mini
- 💡 رؤى وتوصيات لتحسين الأداء
- 📊 اكتشاف الأنماط والمشاكل المحتملة

### 5. إدارة المستخدمين (للمسؤولين)
- 👥 إضافة مستخدمين جدد
- 🔐 صلاحيات مختلفة (مسؤول / مستخدم)
- ⚙️ تفعيل/تعطيل المستخدمين

## 📋 تفاصيل البلاغ

كل بلاغ يحتوي على:
1. **رقم البلاغ** - معرف فريد للبلاغ
2. **تاريخ البلاغ** - تاريخ إنشاء البلاغ
3. **رقم الرخصة** - رقم الرخصة المرتبط
4. **نوع البلاغ**: ترابي / بلاط / إسفلت
5. **حالة البلاغ**: 
   - تم الإصلاح
   - تم الإصلاح-ومتبقي الأسفلت
6. **المحافظة** - موقع البلاغ
7. **العمق بالمتر** - عمق المشكلة
8. **القطر بالملي** - قطر المشكلة
9. **اسم المقاول**: 
   - دار السمار
   - جيتكو
   - شركة الموسي
10. **صور البلاغ** - صور توثيقية (PDF, JPG)

## 🔐 معلومات تسجيل الدخول الافتراضية

**المسؤول:**
- اسم المستخدم: `admin`
- كلمة المرور: `admin123`

## 💻 تشغيل النظام محلياً على اللاب توب

### المتطلبات
- Python 3.11+
- Node.js 16+
- MongoDB 4.4+

### خطوات التثبيت

#### 1. تثبيت MongoDB
```bash
# على Windows
# حمل وثبت MongoDB من: https://www.mongodb.com/try/download/community

# على Linux (Ubuntu/Debian)
sudo apt-get install mongodb

# على macOS
brew install mongodb-community
```

#### 2. تشغيل MongoDB
```bash
# على Windows
mongod

# على Linux/macOS
sudo systemctl start mongod
# أو
mongod --dbpath /path/to/data
```

#### 3. إعداد Backend (Python)
```bash
cd /app/backend

# إنشاء بيئة افتراضية
python -m venv venv

# تفعيل البيئة الافتراضية
# على Windows
venv\Scripts\activate
# على Linux/macOS
source venv/bin/activate

# تثبيت المكتبات
pip install -r requirements.txt

# تشغيل الخادم
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

#### 4. إعداد Frontend (React)
```bash
cd /app/frontend

# تثبيت المكتبات
yarn install
# أو
npm install

# تشغيل التطبيق
yarn start
# أو
npm start
```

#### 5. إنشاء مستخدم مسؤول
```bash
cd /app/backend

python << 'EOF'
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import uuid

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')
    
    admin = {
        "id": str(uuid.uuid4()),
        "username": "admin",
        "email": "admin@wfm.com",
        "full_name": "المسؤول",
        "role": "admin",
        "hashed_password": pwd_context.hash("admin123"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True
    }
    
    await db.users.insert_one(admin)
    print("✅ تم إنشاء حساب المسؤول بنجاح!")
    client.close()

asyncio.run(create_admin())
EOF
```

### 6. الوصول إلى النظام
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs

## 🌐 الوصول إلى النظام المنشور

النظام متاح حالياً على:
https://khibra-hub.preview.emergentagent.com/

## 📝 ملاحظات مهمة

1. **قاعدة البيانات**: النظام يستخدم MongoDB - تأكد من تشغيله قبل بدء الخوادم

2. **البيئة الافتراضية**: تأكد من تفعيل البيئة الافتراضية قبل تشغيل Backend

3. **المنافذ**: 
   - Backend: المنفذ 8001
   - Frontend: المنفذ 3000
   - MongoDB: المنفذ 27017

4. **ملفات .env**: تأكد من تكوين ملفات البيئة بشكل صحيح:
   - `/app/backend/.env` - إعدادات Backend
   - `/app/frontend/.env` - إعدادات Frontend

5. **الذكاء الاصطناعي**: يستخدم النظام مفتاح Emergent LLM للتحليل الذكي

## 🔧 استكشاف الأخطاء

### Backend لا يعمل
```bash
# تحقق من MongoDB
mongod --version
# أو
mongo --eval "db.version()"

# تحقق من المكتبات
pip list | grep fastapi
pip list | grep motor
```

### Frontend لا يعمل
```bash
# امسح ذاكرة التخزين المؤقت
rm -rf node_modules
yarn install

# تحقق من نسخة Node.js
node --version
```

### خطأ في الاتصال بقاعدة البيانات
- تأكد من تشغيل MongoDB
- تحقق من `MONGO_URL` في `/app/backend/.env`

## 📚 البنية التقنية

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MongoDB (Motor async driver)
- **Authentication**: JWT
- **AI**: Emergent LLM Integration (GPT-4o-mini)
- **Files**: Pillow, ReportLab, OpenPyXL

### Frontend
- **Framework**: React 19
- **Routing**: React Router v7
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **UI Components**: shadcn/ui

## 🎯 الاستخدام

### إضافة بلاغ جديد
1. اضغط على "البلاغات" من القائمة الجانبية
2. اضغط على "+ إضافة بلاغ جديد"
3. املأ جميع الحقول المطلوبة
4. ارفع صور البلاغ (اختياري)
5. اضغط "حفظ البلاغ"

### البحث عن بلاغ
1. في صفحة البلاغات، استخدم حقل البحث
2. أدخل رقم البلاغ أو رقم الرخصة
3. استخدم الفلاتر للتصفية حسب المحافظة، النوع، الحالة، التاريخ

### تصدير التقارير
1. في صفحة البلاغات، اختر الفلاتر المطلوبة
2. اضغط على "تصدير Excel" أو "تصدير PDF"
3. سيتم تحميل الملف تلقائياً

### التحليل الذكي
1. اذهب إلى لوحة التحكم
2. اضغط على "إجراء تحليل ذكي للبلاغات"
3. انتظر بضع ثوانٍ
4. ستظهر نتائج التحليل مع التوصيات

## 📞 الدعم

إذا واجهت أي مشاكل أو كان لديك أي استفسارات، يرجى التواصل مع فريق الدعم.

---

**تم التطوير بواسطة:** E1 Agent - Emergent
**التاريخ:** 2025
**الإصدار:** 1.0.0
