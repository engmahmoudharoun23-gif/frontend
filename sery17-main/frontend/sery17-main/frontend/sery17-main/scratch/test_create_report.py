import requests
import json

# Login as admin to get token
login_data = {"username": "admin", "password": "123"}
r_login = requests.post("http://localhost:8000/api/auth/login", data=login_data)
token = r_login.json().get("access_token")

# Try to create a report
headers = {"Authorization": f"Bearer {token}"}
files = {
    'report_number': (None, 'AUTO'),
    'license_number': (None, '12345'),
    'report_type': (None, 'ترابي'),
    'status': (None, 'تم الإصلاح'),
    'governorate': (None, 'شقراء'),
    'project': (None, 'مشروع التشوة البصري'),
    'depth_meters': (None, '1.5'),
    'diameter_mm': (None, '100'),
    'contractor': (None, 'شركة الموسي'),
    'latitude': (None, '24.123'),
    'longitude': (None, '46.123'),
    'asphalt_license_issued': (None, 'false'),
    'notes': (None, '')
}

r = requests.post("http://localhost:8000/api/reports", headers=headers, files=files)
print(r.status_code)
print(r.text)
