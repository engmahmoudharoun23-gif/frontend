import requests

base_url = "http://localhost:8001"

# 1. Login
login_data = {
    "username": "admin",
    "password": "password" # Assuming password is password, or I can check db
}
resp = requests.post(f"{base_url}/api/auth/login", data=login_data)
if resp.status_code != 200:
    print("Login failed!", resp.text)
else:
    token = resp.json()["access_token"]
    print("Logged in!")

    # 2. Get reports
    headers = {"Authorization": f"Bearer {token}"}
    params = {
        "project": "مشروع المحافظات الغربية - القطاع الأوسط",
        "page": 1,
        "limit": 10
    }
    
    # Also add governorate="جميع المحافظات" which frontend might send
    params["governorate"] = "جميع المحافظات"
    params["contractor"] = "جميع المقاولين"
    params["report_type"] = "جميع الأنواع"
    params["status"] = "جميع الحالات"
    
    reports_resp = requests.get(f"{base_url}/api/reports", params=params, headers=headers)
    print("Status:", reports_resp.status_code)
    try:
        data = reports_resp.json()
        print("Total count:", data.get("total_count"))
        print("Number of reports returned:", len(data.get("reports", [])))
    except Exception as e:
        print("Error parsing json:", e)
