import requests, json

# Test with the actual IP that frontend uses
BASE = 'http://192.168.8.10:8001'

# Login
res = requests.post(f'{BASE}/api/auth/login', json={'username': 'admin', 'password': 'admin123'}, timeout=10)
print('Login status:', res.status_code)
if res.status_code == 200:
    data = res.json()
    token = data.get('access_token') or data.get('token')
    h = {'Authorization': 'Bearer ' + token}
    
    # Test init-all
    r = requests.get(f'{BASE}/api/dashboard/init-all', headers=h, timeout=15)
    print('init-all status:', r.status_code)
    if r.status_code == 200:
        d = r.json()
        print('projects count:', len(d.get('projects', {})))
        print('allowed_projects count:', len(d.get('allowed_projects', [])))
        # Print totals
        for name, stats in d.get('projects', {}).items():
            print(f'  {name[:50]}: total={stats.get("total")} fixed={stats.get("fixed")}')
    else:
        print('ERROR:', r.text[:200])
else:
    print('Login failed:', res.text[:200])
