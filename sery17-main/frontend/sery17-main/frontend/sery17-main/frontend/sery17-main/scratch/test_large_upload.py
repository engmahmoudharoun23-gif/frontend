import requests
import os

url = 'http://localhost:8001/api/storage/upload'

# Need a token first. Let's authenticate as admin.
login_data = {
    'username': 'admin',
    'password': 'admin123'
}
res = requests.post('http://localhost:8001/api/auth/login', json=login_data)
if res.status_code == 200:
    token = res.json()['access_token']
    
    # Create 11MB file to test Cloudinary limit
    large_data = b'0' * (11 * 1024 * 1024)
    files = {'file': ('large_report.pdf', large_data, 'application/pdf')}
    headers = {'Authorization': f'Bearer {token}'}
    print("Uploading 11MB file...")
    res_upload = requests.post(url, files=files, headers=headers)
    print("Upload status:", res_upload.status_code)
    print("Upload response:", res_upload.text)
else:
    print("Login failed", res.text)
