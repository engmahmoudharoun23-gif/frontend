import requests, json

res = requests.post('http://localhost:8001/api/auth/login', json={'username': 'admin', 'password': 'admin123'}, timeout=10)
token = res.json().get('access_token') or res.json().get('token')
h = {'Authorization': 'Bearer ' + token}

# test init-all
r = requests.get('http://localhost:8001/api/dashboard/init-all', headers=h, timeout=15)
print('init-all status:', r.status_code)
if r.status_code == 200:
    data = r.json()
    print('keys:', list(data.keys()))
    projects = data.get('projects', {})
    print('projects count:', len(projects))
    print('allowed_projects:', data.get('allowed_projects', []))
    for pname, pdata in list(projects.items())[:3]:
        print('  Project:', pname[:50])
        print('    total=', pdata.get('total'), 'fixed=', pdata.get('fixed'), 'cards=', len(pdata.get('cards', [])))
else:
    print('ERROR:', r.text[:500])
