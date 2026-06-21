"""
اختبار مباشر - تشخيص دقيق للمشكلة
"""
import requests
import json

BASE = "http://localhost:8001/api"

# تسجيل دخول
r = requests.post(f"{BASE}/auth/login", json={"username": "admin", "password": "admin123"})
admin_token = r.json().get("access_token", "") if r.status_code == 200 else ""
admin_headers = {"Authorization": f"Bearer {admin_token}"}

import datetime
today = datetime.date.today().isoformat()

# 1. من هو صاحب UUID = de8f29f5-8b4c-4ca9-b1ac-62fd2a3de438
print("1. من هو صاحب البلاغ...")
uid = "de8f29f5-8b4c-4ca9-b1ac-62fd2a3de438"
users_r = requests.get(f"{BASE}/users", headers=admin_headers)
users = users_r.json() if users_r.status_code == 200 else []
if isinstance(users, dict):
    users = users.get("users", [])
for u in users:
    if u.get("id") == uid or u.get("username") == uid:
        print(f"  البلاغ من: {u.get('full_name')} | role: {u.get('role')} | can_create_subusers: {u.get('can_create_subusers')}")
        break
else:
    print(f"  UUID غير موجود في قائمة المستخدمين! (ربما الأدمن نفسه)")
    # تحقق من معرف الأدمن
    me_r = requests.get(f"{BASE}/auth/me", headers=admin_headers)
    me = me_r.json()
    print(f"  بيانات الأدمن: id={me.get('id')} | username={me.get('username')} | full_name={me.get('full_name')}")

# 2. اختبار last-72-hours-list مع عبد الحفيظ
login_r = requests.post(f"{BASE}/auth/login", json={"username": "Eng Abdul Hafeez", "password": "123456"})
abd_token = login_r.json().get("access_token", "")
abd_headers = {"Authorization": f"Bearer {abd_token}"}

print("\n2. قيود المستخدم عبد الحفيظ من /auth/me...")
me_r = requests.get(f"{BASE}/auth/me", headers=abd_headers)
me = me_r.json()
print(f"  id: {me.get('id')}")
print(f"  username: {me.get('username')}")
print(f"  projects: {me.get('projects')}")
print(f"  governorates: {me.get('governorates')}")
print(f"  can_create_subusers: {me.get('can_create_subusers')}")
print(f"  permissions: {me.get('permissions')}")
print(f"  project_permissions: {me.get('project_permissions')}")

# 3. اختبار last-72-hours-list بدون أي فلتر
print("\n3. قائمة البلاغات 24h لعبد الحفيظ (بدون فلتر)...")
r2 = requests.get(f"{BASE}/reports/last-72-hours-list?category=reports", headers=abd_headers)
print(f"  Status: {r2.status_code}")
if r2.status_code == 200:
    data = r2.json()
    reports = data.get("reports", [])
    print(f"  عدد البلاغات: {len(reports)}")
    for rpt in reports[:5]:
        print(f"    - {rpt.get('report_number')} | gov: {rpt.get('governorate')} | created_by: {rpt.get('created_by')}")

# 4. اختبار مع base_date اليوم
print(f"\n4. قائمة 24h مع base_date={today}...")
r3 = requests.get(f"{BASE}/reports/last-72-hours-list?category=reports&base_date={today}", headers=abd_headers)
print(f"  Status: {r3.status_code}")
if r3.status_code == 200:
    reports = r3.json().get("reports", [])
    print(f"  عدد البلاغات: {len(reports)}")
    for rpt in reports[:5]:
        print(f"    - {rpt.get('report_number')} | gov: {rpt.get('governorate')} | created_by: {rpt.get('created_by')}")

# 5. اختبار بدون قيود (تعديل مؤقت للاختبار)
print("\n5. governorate-72h-counts لعبد الحفيظ...")
r4 = requests.get(f"{BASE}/reports/governorate-72h-counts?category=reports&base_date={today}", headers=abd_headers)
print(f"  Status: {r4.status_code}, Data: {r4.json()}")

print("\nانتهى")
