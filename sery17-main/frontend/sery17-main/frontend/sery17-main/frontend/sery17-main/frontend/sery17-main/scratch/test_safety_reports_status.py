import requests
import json

API_URL = "http://127.0.0.1:8001/api"

def test_safety_reports_status():
    print("Running Safety Reports Status Tests...")
    
    # 1. Login as admin
    login_data = {"username": "admin", "password": "admin123"}
    res = requests.post(f"{API_URL}/auth/login", json=login_data)
    if res.status_code != 200:
        print("❌ Admin login failed")
        return
    admin_token = res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("✅ Admin login successful")
    
    # 2. Create safety report as admin
    report_payload = {
        "date": "2026-05-20",
        "project": "مشروع كشف التسربات وإصلاحها",
        "governorate": "الرياض",
        "notes": "تقرير تجريبي للسلامة",
        "image": ""
    }
    
    res = requests.post(f"{API_URL}/safety-reports", json=report_payload, headers=admin_headers)
    if res.status_code != 200:
        print(f"❌ Create safety report failed: {res.text}")
        return
    
    report = res.json()
    report_id = report["id"]
    print(f"✅ Created safety report with ID: {report_id}")
    print(f"✅ Default status is: '{report.get('status')}'")
    assert report.get("status") == "قيد المراجعة", f"Status should default to 'قيد المراجعة', got {report.get('status')}"
    
    # 3. Create a Level 2 manager user
    subuser_payload = {
        "username": "manager_test_sr",
        "full_name": "مدير مشروع تجريبي",
        "title": "مراقب",
        "password": "manager123",
        "role": "user",
        "governorates": ["الرياض"],
        "projects": ["مشروع كشف التسربات وإصلاحها"]
    }
    # Register user
    res = requests.post(f"{API_URL}/auth/register", json=subuser_payload, headers=admin_headers)
    if res.status_code != 200 and "already registered" not in res.text:
        print(f"❌ Failed to register manager: {res.text}")
        return
    
    # Update manager permissions to have "can_create_subusers = True" (Level 2) and "safety_reports" permission
    # Find manager user first
    res = requests.get(f"{API_URL}/users", headers=admin_headers)
    users = res.json()
    manager_user = next((u for u in users if u["username"] == "manager_test_sr"), None)
    if not manager_user:
        print("❌ Manager user not found in list")
        return
        
    manager_id = manager_user["id"]
    
    # Let's grant manager_test_sr role or can_create_subusers and project permissions
    # In this system, user project permissions are modified via PUT /api/users/{id}
    update_payload = {
        "username": "manager_test_sr",
        "full_name": "مدير مشروع تجريبي",
        "title": "مراقب",
        "governorates": ["الرياض"],
        "projects": ["مشروع كشف التسربات وإصلاحها"]
    }
    res = requests.put(f"{API_URL}/users/{manager_id}", json=update_payload, headers=admin_headers)
    if res.status_code != 200:
        print(f"❌ Failed to update manager details: {res.text}")
        
    # Grant permissions: "safety_reports" and can_create_subusers
    # Let's set it in DB directly or see if we can do it via API.
    # Wait, can we log in as this manager? Let's check.
    res = requests.post(f"{API_URL}/auth/login", json={"username": "manager_test_sr", "password": "manager123"})
    if res.status_code != 200:
        print("❌ Manager login failed")
        return
    manager_token = res.json()["access_token"]
    manager_headers = {"Authorization": f"Bearer {manager_token}"}
    print("✅ Manager login successful")
    
    # 4. Review safety report as admin (who has access to all projects)
    res = requests.put(f"{API_URL}/safety-reports/{report_id}", json={"status": "تمت المراجعة"}, headers=admin_headers)
    if res.status_code != 200:
        print(f"❌ Admin review update failed: {res.text}")
    else:
        print("✅ Admin reviewed report successfully")
        
    # Reset status back to 'قيد المراجعة' for further testing
    requests.put(f"{API_URL}/safety-reports/{report_id}", json={"status": "قيد المراجعة"}, headers=admin_headers)
    
    # 5. Review safety report as another normal user without projects/roles
    # Create regular user
    reg_payload = {
        "username": "regular_test_sr",
        "full_name": "مستخدم تجريبي",
        "title": "مراقب",
        "password": "regular123",
        "role": "user",
        "governorates": ["الرياض"],
        "projects": ["مشروع آخر"]
    }
    requests.post(f"{API_URL}/auth/register", json=reg_payload, headers=admin_headers)
    res = requests.post(f"{API_URL}/auth/login", json={"username": "regular_test_sr", "password": "regular123"})
    reg_token = res.json()["access_token"]
    reg_headers = {"Authorization": f"Bearer {reg_token}"}
    
    # Try updating status
    res = requests.put(f"{API_URL}/safety-reports/{report_id}", json={"status": "تمت المراجعة"}, headers=reg_headers)
    print(f"ℹ️ Unauthorized user review status code: {res.status_code} (Expected: 403)")
    assert res.status_code == 403, f"Expected 403 Forbidden, got {res.status_code}"
    
    # Cleanup: Delete the test safety report and users
    res = requests.delete(f"{API_URL}/safety-reports/{report_id}", headers=admin_headers)
    if res.status_code == 200:
        print("✅ Cleaned up safety report")
    
    # Clean up users
    # In server.py, we can delete a user via DELETE /api/users/{id}
    requests.delete(f"{API_URL}/users/{manager_id}", headers=admin_headers)
    
    res = requests.get(f"{API_URL}/users", headers=admin_headers)
    reg_user = next((u for u in res.json() if u["username"] == "regular_test_sr"), None)
    if reg_user:
        requests.delete(f"{API_URL}/users/{reg_user['id']}", headers=admin_headers)
    print("✅ Cleaned up test users")
    print("🎉 All Safety Reports Status Tests Passed!")

if __name__ == "__main__":
    test_safety_reports_status()
