# توثيق API - نظام إدارة البلاغات WFM

## 🔗 Base URL
```
https://khibra-hub.preview.emergentagent.com/api
```

أو محلياً:
```
http://localhost:8001/api
```

---

## 🔐 المصادقة (Authentication)

جميع APIs تتطلب JWT Token ماعدا `/auth/register` و `/auth/login`

**Header:**
```
Authorization: Bearer <YOUR_TOKEN>
```

---

## 📍 Endpoints

### 1. المصادقة

#### تسجيل مستخدم جديد
```http
POST /auth/register
Content-Type: application/json

{
  "username": "user1",
  "email": "user1@example.com",
  "full_name": "اسم المستخدم",
  "password": "password123",
  "role": "user"
}
```

#### تسجيل الدخول
```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "username": "admin",
    "email": "admin@wfm.com",
    "full_name": "المسؤول",
    "role": "admin",
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

#### الحصول على معلومات المستخدم الحالي
```http
GET /auth/me
Authorization: Bearer <TOKEN>
```

---

### 2. إدارة البلاغات

#### الحصول على جميع البلاغات
```http
GET /reports
Authorization: Bearer <TOKEN>

Query Parameters (اختياري):
- search: رقم البلاغ أو رقم الرخصة
- governorate: المحافظة
- report_type: نوع البلاغ
- status: الحالة
- date_from: من تاريخ (YYYY-MM-DD)
- date_to: إلى تاريخ (YYYY-MM-DD)
```

#### الحصول على بلاغ محدد
```http
GET /reports/{report_id}
Authorization: Bearer <TOKEN>
```

#### إضافة بلاغ جديد
```http
POST /reports
Authorization: Bearer <TOKEN>
Content-Type: multipart/form-data

Form Data:
- report_number: رقم البلاغ (مطلوب)
- report_date: تاريخ البلاغ ISO format (مطلوب)
- license_number: رقم الرخصة (مطلوب)
- report_type: نوع البلاغ (مطلوب)
- status: الحالة (مطلوب)
- governorate: المحافظة (مطلوب)
- depth_meters: العمق بالمتر (مطلوب)
- diameter_mm: القطر بالملي (مطلوب)
- contractor: اسم المقاول (مطلوب)
- images: ملفات الصور (اختياري) - multiple files
```

#### تعديل بلاغ
```http
PUT /reports/{report_id}
Authorization: Bearer <TOKEN>
Content-Type: multipart/form-data

Form Data: (جميع الحقول اختيارية)
- report_number: رقم البلاغ
- report_date: تاريخ البلاغ ISO format
- license_number: رقم الرخصة
- report_type: نوع البلاغ
- status: الحالة
- governorate: المحافظة
- depth_meters: العمق بالمتر
- diameter_mm: القطر بالملي
- contractor: اسم المقاول
- images: ملفات الصور - multiple files
```

#### حذف بلاغ (soft delete)
```http
DELETE /reports/{report_id}
Authorization: Bearer <TOKEN>
```

---

### 3. سلة المحذوفات

#### الحصول على البلاغات المحذوفة
```http
GET /reports-trash
Authorization: Bearer <TOKEN>
```

#### استرداد بلاغ محذوف
```http
POST /reports-trash/{report_id}/restore
Authorization: Bearer <TOKEN>
```

#### حذف نهائي (admin فقط)
```http
DELETE /reports-trash/{report_id}/permanent
Authorization: Bearer <TOKEN>
```

---

### 4. التصدير

#### تصدير إلى Excel
```http
GET /reports/export/excel
Authorization: Bearer <TOKEN>

Query Parameters (اختياري):
- نفس فلاتر /reports
```

**Response:** ملف Excel (.xlsx)

#### تصدير إلى PDF
```http
GET /reports/export/pdf
Authorization: Bearer <TOKEN>

Query Parameters (اختياري):
- نفس فلاتر /reports
```

**Response:** ملف PDF (.pdf)

---

### 5. التحليل الذكي بالـ AI

#### تحليل البلاغات
```http
POST /reports/analyze
Authorization: Bearer <TOKEN>
```

**Response:**
```json
{
  "analysis": "نص التحليل الذكي من GPT-4o-mini...",
  "summary": "ملخص البيانات الإحصائية..."
}
```

---

### 6. إدارة المستخدمين (Admin فقط)

#### الحصول على جميع المستخدمين
```http
GET /users
Authorization: Bearer <TOKEN>
```

#### تفعيل/تعطيل مستخدم
```http
PUT /users/{user_id}/toggle-active
Authorization: Bearer <TOKEN>
```

#### حذف مستخدم
```http
DELETE /users/{user_id}
Authorization: Bearer <TOKEN>
```

---

### 7. الصحة والحالة

#### فحص صحة النظام
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy"
}
```

#### الصفحة الرئيسية
```http
GET /
```

**Response:**
```json
{
  "message": "WFM Report Management System API"
}
```

---

## 📝 نماذج البيانات (Data Models)

### User
```json
{
  "id": "uuid",
  "username": "string",
  "email": "email@example.com",
  "full_name": "string",
  "role": "admin | user",
  "is_active": true,
  "created_at": "2025-01-01T00:00:00Z"
}
```

### Report
```json
{
  "id": "uuid",
  "report_number": "string",
  "report_date": "2025-01-01T00:00:00Z",
  "license_number": "string",
  "report_type": "ترابي | بلاط | إسفلت",
  "status": "تم الإصلاح | تم الإصلاح-ومتبقي الأسفلت",
  "governorate": "string",
  "depth_meters": 1.5,
  "diameter_mm": 200.0,
  "contractor": "دار السمار | جيتكو | شركة الموسي",
  "images": ["data:image/jpeg;base64,..."],
  "created_by": "user_id",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z",
  "is_deleted": false
}
```

---

## 🔒 رموز الحالة (Status Codes)

- **200 OK** - نجحت العملية
- **201 Created** - تم الإنشاء بنجاح
- **400 Bad Request** - بيانات غير صحيحة
- **401 Unauthorized** - مطلوب مصادقة
- **403 Forbidden** - لا توجد صلاحية
- **404 Not Found** - المورد غير موجود
- **500 Internal Server Error** - خطأ في الخادم

---

## 🧪 أمثلة cURL

### تسجيل الدخول والحصول على Token
```bash
TOKEN=$(curl -s -X POST "https://khibra-hub.preview.emergentagent.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' \
  | jq -r '.access_token')

echo $TOKEN
```

### الحصول على البلاغات
```bash
curl -X GET "https://khibra-hub.preview.emergentagent.com/api/reports" \
  -H "Authorization: Bearer $TOKEN"
```

### إضافة بلاغ جديد
```bash
curl -X POST "https://khibra-hub.preview.emergentagent.com/api/reports" \
  -H "Authorization: Bearer $TOKEN" \
  -F "report_number=RPT-001" \
  -F "report_date=2025-01-15T10:00:00Z" \
  -F "license_number=LIC-123" \
  -F "report_type=ترابي" \
  -F "status=تم الإصلاح" \
  -F "governorate=الرياض" \
  -F "depth_meters=2.5" \
  -F "diameter_mm=300" \
  -F "contractor=دار السمار"
```

### البحث والفلترة
```bash
curl -X GET "https://khibra-hub.preview.emergentagent.com/api/reports?search=RPT-001&governorate=الرياض" \
  -H "Authorization: Bearer $TOKEN"
```

### تصدير إلى Excel
```bash
curl -X GET "https://khibra-hub.preview.emergentagent.com/api/reports/export/excel" \
  -H "Authorization: Bearer $TOKEN" \
  -o reports.xlsx
```

### التحليل الذكي
```bash
curl -X POST "https://khibra-hub.preview.emergentagent.com/api/reports/analyze" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📚 وثائق Swagger التفاعلية

يمكنك الوصول إلى وثائق Swagger التفاعلية على:
```
https://khibra-hub.preview.emergentagent.com/docs
```

أو محلياً:
```
http://localhost:8001/docs
```

---

## 🔧 معالجة الأخطاء

جميع الأخطاء تُرجع بصيغة JSON:

```json
{
  "detail": "رسالة الخطأ هنا"
}
```

---

## 💡 نصائح للمطورين

1. **احفظ Token** - Token صالح لمدة 30 يوم
2. **استخدم HTTPS** - في بيئة الإنتاج
3. **معالجة الأخطاء** - تحقق دائماً من status code
4. **التنسيق** - استخدم ISO 8601 للتواريخ
5. **الصور** - الصور مرمزة بـ Base64 في الاستجابات

---

**نهاية التوثيق**
