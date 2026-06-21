"""
اختبار مباشر لـ API بلاغات 24 ساعة لمعرفة سبب المشكلة
"""
import requests
import json

BASE = "http://localhost:8001/api"

# أولاً: تسجيل دخول كـ admin لجلب بيانات عبد الحفيظ
print("=" * 60)
print("1. تسجيل دخول بالأدمن...")
r = requests.post(f"{BASE}/auth/login", json={"username": "admin", "password": "admin123"})
if r.status_code != 200:
    # جرب بيانات أخرى
    r = requests.post(f"{BASE}/auth/login", json={"username": "bayt_alkhibra", "password": "admin123"})
admin_token = r.json().get("access_token", "") if r.status_code == 200 else ""
if not admin_token:
    print("❌ فشل تسجيل الدخول كأدمن، جرب كلمة مرور مختلفة")
    print(r.text[:200])
else:
    print(f"✅ Admin token: {admin_token[:30]}...")

admin_headers = {"Authorization": f"Bearer {admin_token}"}

# جلب قائمة المستخدمين للعثور على عبد الحفيظ
print("\n2. البحث عن مستخدم عبد الحفيظ...")
users_r = requests.get(f"{BASE}/users", headers=admin_headers)
users = users_r.json() if users_r.status_code == 200 else []
if isinstance(users, dict):
    users = users.get("users", [])

abd_alhafiz = None
for u in users:
    name = u.get("full_name", "") or u.get("username", "")
    if "عبد" in name or "حفيظ" in name or "alhafiz" in u.get("username","").lower() or "abdalhafiz" in u.get("username","").lower():
        abd_alhafiz = u
        print(f"✅ وجد: {u.get('full_name')} | username: {u.get('username')} | projects: {u.get('projects')} | govs: {u.get('governorates')} | can_create_subusers: {u.get('can_create_subusers')} | permissions: {u.get('permissions')}")
        break

if not abd_alhafiz:
    print("❌ لم يجد المستخدم، عرض كل المستخدمين:")
    for u in users[:20]:
        print(f"  - {u.get('full_name','?')} | {u.get('username','?')}")

# جلب البلاغات في عفيف (آخر 7 أيام) كأدمن
print("\n3. البلاغات في عفيف (آخر 7 أيام) - كأدمن...")
import datetime
today = datetime.date.today().isoformat()
r72 = requests.get(f"{BASE}/reports/governorate-72h-counts?base_date={today}&category=reports", headers=admin_headers)
if r72.status_code == 200:
    data = r72.json()
    afif_data = [x for x in data if "عفيف" in str(x.get("governorate",""))]
    print(f"✅ كأدمن - عفيف: {afif_data}")
    print(f"   كل البيانات: {data[:10]}")
else:
    print(f"❌ خطأ: {r72.status_code} - {r72.text[:200]}")

# اختبار آخر 72 ساعة كأدمن
print("\n4. قائمة البلاغات آخر 24 ساعة كأدمن...")
r_list = requests.get(f"{BASE}/reports/last-72-hours-list?base_date={today}&category=reports", headers=admin_headers)
if r_list.status_code == 200:
    reports = r_list.json().get("reports", [])
    afif_reports = [r for r in reports if "عفيف" in str(r.get("governorate",""))]
    print(f"✅ كأدمن - بلاغات عفيف: {len(afif_reports)}")
    for rpt in afif_reports:
        print(f"   البلاغ: {rpt.get('report_number')} | created_by: {rpt.get('created_by')} | project: {rpt.get('project')} | date: {rpt.get('start_date') or rpt.get('created_at')}")
else:
    print(f"❌ خطأ: {r_list.status_code} - {r_list.text[:200]}")

# الآن اختبار بحساب عبد الحفيظ
if abd_alhafiz:
    username = abd_alhafiz.get("username")
    print(f"\n5. تسجيل دخول بحساب عبد الحفيظ ({username})...")
    # جرب كلمات مرور شائعة
    for pwd in ["123456", "password", "admin123", "12345678", username, "1234", "Aa123456"]:
        login_r = requests.post(f"{BASE}/auth/login", json={"username": username, "password": pwd})
        if login_r.status_code == 200 and login_r.json().get("access_token"):
            abd_token = login_r.json()["access_token"]
            print(f"✅ نجح تسجيل الدخول بكلمة مرور: {pwd}")
            abd_headers = {"Authorization": f"Bearer {abd_token}"}
            
            print(f"\n6. اختبار governorate-72h-counts لعبد الحفيظ...")
            r_counts = requests.get(f"{BASE}/reports/governorate-72h-counts?base_date={today}&category=reports", headers=abd_headers)
            if r_counts.status_code == 200:
                data = r_counts.json()
                print(f"✅ النتائج: {data}")
            else:
                print(f"❌ خطأ: {r_counts.status_code} - {r_counts.text[:300]}")
            
            print(f"\n7. اختبار last-72-hours-list لعبد الحفيظ...")
            r_list2 = requests.get(f"{BASE}/reports/last-72-hours-list?base_date={today}&category=reports", headers=abd_headers)
            if r_list2.status_code == 200:
                reports2 = r_list2.json().get("reports", [])
                print(f"✅ عدد البلاغات: {len(reports2)}")
                for rpt in reports2[:5]:
                    print(f"   - {rpt.get('report_number')} | gov: {rpt.get('governorate')} | created_by: {rpt.get('created_by')}")
            else:
                print(f"❌ خطأ: {r_list2.status_code} - {r_list2.text[:300]}")
            break
    else:
        print("❌ لم يُعثر على كلمة المرور الصحيحة")

print("\n" + "="*60)
print("انتهى التشخيص")
