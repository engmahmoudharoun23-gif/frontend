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
    
    files = {'file': ('test.txt', b'hello world', 'text/plain')}
    headers = {'Authorization': f'Bearer {token}'}
    res_upload = requests.post(url, files=files, headers=headers)
    print("Upload status:", res_upload.status_code)
    print("Upload response:", res_upload.text)
else:
    print("Login failed", res.text)
