import requests, json

res = requests.post('http://localhost:8001/api/auth/login', json={'username': 'admin', 'password': 'admin123'}, timeout=10)
token = res.json().get('access_token') or res.json().get('token')
h = {'Authorization': 'Bearer ' + token}

# Get projects from API
r = requests.get('http://localhost:8001/api/projects', headers=h, timeout=10)
with open('scratch/api_projects.json', 'w', encoding='utf-8') as f:
    json.dump(r.json(), f, ensure_ascii=False, indent=2)

# Get reports stats
r2 = requests.get('http://localhost:8001/api/reports/stats', headers=h, timeout=10)
with open('scratch/api_stats.json', 'w', encoding='utf-8') as f:
    json.dump(r2.json(), f, ensure_ascii=False, indent=2)

# Get project cards
r3 = requests.get('http://localhost:8001/api/project-cards', headers=h, timeout=10)
cards = r3.json()
with open('scratch/api_cards.json', 'w', encoding='utf-8') as f:
    json.dump(cards[:5], f, ensure_ascii=False, indent=2)

print('Done - Projects:', len(r.json()))
print('Stats keys:', list(r2.json().keys())[:10])
print('Cards:', len(cards))
