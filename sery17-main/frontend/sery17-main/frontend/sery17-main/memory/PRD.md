# بيت الخبرة - Bayt Al-Khibra Internal Management System

## Problem Statement
نظام إدارة داخلي مع RBAC دقيق (عام + لكل مشروع)، وحدات بلاغات/توصيلات/فواتير/HR/إعدادات، مع تفويض الاعتماد النهائي.

## Tech Stack
React + FastAPI + MongoDB + Emergent Object Storage

## Session Implementations (Feb 2026)

### 1. Per-Project Permissions ✅
- `project_permissions: Dict[str, List[str]]` في User model
- Override exclusive logic
- Helpers: `has_project_permission`, `get_projects_with_permission`, `user_has_any_project_permission`
- UI في Users.js لكل مشروع على حدة
- Sidebar dynamic routing لكل مشروع

### 2. Delegated Final Approval ✅
- `review_invoices_3` / `view_all_invoices` / `review_employee_requests`
- فصل المهام (separation of duties)
- عرض "نيابة عن بيت الخبرة: [الاسم]"
- `has_sub_users` flag للتمييز بين L2 الحقيقي والمفوض

### 3. Notification Badges ✅
- /api/notifications/pending-count يشمل الآن:
  - Admin: approved_by_manager items
  - المديرون (has_sub_users): pending من موظفيهم
  - المفوضون (review_invoices_3/view_all): approved_by_manager items (باستثناء ما اعتمده هو أولياً)
- Badge تلقائي يختفي بعد المراجعة

### 4. Branding Settings (جديد) ✅
- جميع الأسماء والصور قابلة للتحرير من الإعدادات:
  - اسم الشركة / الشركة الشريكة
  - مدير عام المشاريع (اسم + مسمى)
  - منسق المشاريع (اسم + مسمى)
  - اسم الاستشاري
  - نبذة عن الشركة + وصف صفحة الدخول
  - شعار الشركة / الشركة الشريكة (رفع صور)
- Hook مركزي `useBranding()` مع caching
- Invalidation cache بعد الحفظ + reload
- Endpoints:
  - GET `/api/settings/platform` (عامة - ترجع branding كامل)
  - PUT `/api/settings/branding` (Admin only)
  - POST `/api/storage/upload` (رفع صور)

### 5. L2 Permission Revocation Fix (Feb 2026) ✅
- `PUT /api/users/{user_id}/connection-permissions` كان admin-only
- السبب: Users.js يستدعي هذا الendpoint دائماً عند الحفظ (legacy field)
- النتيجة: المستوى 2 يرى toast خطأ حتى لو نجح تحديث الصلاحيات الأساسية
- الحل: السماح للـ admin أو L2 creator بتعديل هذا الحقل
- اختبار: نجح curl لكل من admin و Medhat (L2)

### 6. Dynamic Notifications (Feb 2026) ✅
**مشكلة:** endpoints الإشعارات (`/reports/notifications/unseen`, `/seen`) تفحص فقط `permissions` العامة، وتتجاهل `project_permissions`. نتيجة: مستخدم لديه `reports_notifications` كصلاحية project-scoped لم يكن يرى أي إشعار.

**الإصلاح في `/app/backend/server.py`:**
- استخدام `get_projects_with_permission(user, "reports_notifications")` بدل الفحص العام
- فلترة الإشعارات على المشاريع المصرح بها فقط + فلترة المحافظات
- تطبيق نفس المنطق على `get_seen_reports`

**نتائج الاختبار:**
- Medhat مع `reports_notifications` على 3 مشاريع → يرى 2 بلاغ غير مقروء مجمعة حسب المحافظة (ضرماء: 2) ✅
- Pending review count: 3 (ديناميكي حسب المشاريع + المحافظات) ✅

### 7. Unified Notifications — Reports + Connections (Feb 2026) ✅
**المشكلة:** إضافة توصيلات جديدة لا تُولّد إشعاراً. أيقونة "بانتظار المراجعة" تظهر للمراجعين فقط (ليس للمنشئين).

**الإصلاحات:**

1. **`/api/reports/notifications/unseen`** (دمج البلاغات + التوصيلات):
   - يرجع الآن: `reports[]`, `water_connections[]`, `sewage_connections[]`, `counts{}`, `by_governorate[]`
   - فلترة لكل نوع حسب صلاحيات المشروع:
     * بلاغات → `reports_notifications`
     * توصيلات مياه → `water_connections`
     * توصيلات صرف → `sewage_connections`
   - استبعاد ما أنشأه المستخدم نفسه
   - استخدام `is_deleted: {$ne: True}` ليدعم الوثائق القديمة بدون الحقل

2. **`/api/reports/pending-review-count`** (شامل للمنشئين):
   - المراجعون يرون كل البلاغات المنتظرة مراجعتها في مشاريعهم (+ فلتر محافظات)
   - المنشئون يرون بلاغاتهم الشخصية المنتظرة مراجعتها
   - `$or: [reviewer_clause, {created_by: user.id}]`

3. **Endpoints جديدة للتوصيلات:**
   - `POST /water-connections/{id}/mark-seen`
   - `POST /sewage-connections/{id}/mark-seen`
   - `DELETE /water-connections/{id}/notification`
   - `DELETE /sewage-connections/{id}/notification`

4. **Frontend (Layout.js):**
   - جرس الإشعارات يظهر لأي من: `reports_notifications`, `water_connections`, `sewage_connections`
   - Dropdown يعرض قسمين جديدين: 💧 توصيلات مياه جديدة، 🚰 توصيلات صرف جديدة
   - جرس "بانتظار المراجعة" يظهر لـ: `reports_review` أو `reports_add` أو `reports_view`

**اختبار ناجح:**
- Shawqi أضاف توصيلة صرف في التشوة البصري → Medhat يراها (count=2)، Admin يراها (total=6) ✅

### 8. Support Messages Fix (Feb 2026) ✅
**المشاكل المبلغ عنها:**
- أيقونة رسائل الدعم لا تظهر إشعار (Badge) للمستخدمين الذين مُنحوا `support_messages`
- رسائل الدعم لا تصل للمستخدمين غير محمود هارون

**الأسباب الجذرية:**
1. **Frontend:** كان يجلب عدد رسائل الدعم فقط للمستخدم `Eng Mahmoud Haroun` (`if (user.username === 'Eng Mahmoud Haroun')`)
2. **Backend `/support/messages`:** يفحص فقط `permissions` العامة ويتجاهل `project_permissions`
3. **Backend Query:** يفلتر الرسائل بـ `project in user_projects` لكن رسائل الدعم لا تحتوي حقل `project` أصلاً → Result=0
4. **PATCH/DELETE:** مقيّد بأسماء مستخدمين محددة (`admin` أو `Eng Mahmoud Haroun`)

**الإصلاحات:**
- `Layout.js`: fetch count لأي مستخدم لديه `support_messages` (عامة أو لكل مشروع) أو Admin
- `/api/support/messages` + `/count`: استخدام `user_has_any_project_permission` + إزالة فلتر `project` (رسائل الدعم نظام شامل)
- `/api/support/messages/{id}/status` + DELETE: السماح لأي مستخدم لديه `support_messages`

**اختبار (curl):**
- Medhat (general perm): count=1، messages=3 ✅
- Mahmoud Haroun: count=1 ✅
- ConnectionsHub: per-project permission check (لم يعد يعيد توجيه خاطئ)
- Reports: per-project permission
- Invoices: "All Projects" filter يعمل
- L2 self-approval (manager can approve own pending invoice)
- Button label "اعتماد نهائي" يظهر للمفوض عند approved_by_manager

## Test Credentials
- admin / 123456
- Eng Medhat Hussien / 123456 (L2, 7 sub-users)
- Mudawi / 123456 (delegated, 0 sub-users, has review_invoices_3)

## Next Backlog

### P1 - Priority
- 🏦 **Accounting Module** (كبير - مواصفات ضخمة استلمت):
  - Phase 1: Foundation (enable/disable, per-user access, separate password, audit log)
  - Phase 2: General Ledger, Chart of Accounts, Customer/Supplier Invoices
  - Phase 3: Expenses, Banks/Cash, Payments, Clients/Suppliers
  - Phase 4: Reports (P&L, Balance Sheet, Cash Flow), Power BI Dashboard, Budgets, Payroll, Export
- إشعارات ديناميكية للمراجعين حسب الصلاحية لكل مشروع

### P2 - Backlog
- Refactor server.py (11,700+ سطر) إلى routers
- Server-side pagination للجداول الكبيرة
- Code review findings:
  - Replace `is True/False` with `==` (لا يسبب bugs فعلية - انخفاض الأولوية)
  - استبدال random بـ secrets في بعض الأماكن
  - إضافة type hints

## Known Issues
- Login على الدومين المخصص baytalkhibra.site (4x فشل، مؤجل)


### 9. Dynamic User Filter in Reports Export (Feb 2026) ✅
**المشكلة:** أيقونة 'المستخدم' في فلاتر تصدير البلاغات كانت hardcoded (Mohamed Esmat, ElShazly فقط) وتظهر لمشروع 'إصلاح الغربية' فقط ولأسماء مستخدمين محددة.

**الإصلاح:**
- Backend /api/users/level3: يقبل project و governorate كـ query params
- Frontend Reports.js: يعيد التحميل عند تغيير الفلاتر، ويظهر للـ admin/L2/view_all_invoices
- اختبار: Admin+التشوة البصري=11، Admin+الغربية+شقراء=5، Medhat=8
