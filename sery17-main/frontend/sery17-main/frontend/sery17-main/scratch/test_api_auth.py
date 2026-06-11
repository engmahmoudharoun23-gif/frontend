import requests

url = "http://localhost:8001/api/auth/login"
data = {"username": "admin", "password": "123"}
res = requests.post(url, json=data)
if res.status_code == 200:
    token = res.json().get("token")
    headers = {"Authorization": f"Bearer {token}"}
    
    projects_res = requests.get("http://localhost:8001/api/projects", headers=headers)
    print("Projects:", projects_res.json())
    
    stats_res = requests.get("http://localhost:8001/api/reports/stats?project=مشروع ايصال", headers=headers)
    print("Stats for 'مشروع ايصال':", stats_res.json())
    
    init_all_res = requests.get("http://localhost:8001/api/dashboard/init-all", headers=headers)
    print("Init All:", init_all_res.status_code, init_all_res.text[:200])
else:
    print("Login failed:", res.status_code, res.text)
