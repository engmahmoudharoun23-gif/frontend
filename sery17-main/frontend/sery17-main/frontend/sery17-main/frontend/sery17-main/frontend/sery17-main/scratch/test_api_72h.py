import requests

# Login to get token
login_data = {
    "username": "admin",
    "password": "123"
}
res = requests.post("http://localhost:8001/api/auth/login", json=login_data)
if res.status_code != 200:
    print("Login failed:", res.text)
    exit()

token = res.json()["token"]
headers = {"Authorization": f"Bearer {token}"}

# 1. Test governorate-72h-counts
print("Testing /reports/governorate-72h-counts?base_date=2026-05-26...")
res1 = requests.get("http://localhost:8001/api/reports/governorate-72h-counts?base_date=2026-05-26", headers=headers)
print("Badges:", res1.json())

# 2. Test last-72-hours-list
print("\nTesting /reports/last-72-hours-list?base_date=2026-05-26...")
res2 = requests.get("http://localhost:8001/api/reports/last-72-hours-list?base_date=2026-05-26", headers=headers)
print("List count:", len(res2.json().get("reports", [])))
