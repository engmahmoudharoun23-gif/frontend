import sys

with open('d:/sery17-main/sery17-main/backend/server.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def print_post_endpoints():
    for i, line in enumerate(lines):
        if line.startswith('@api_router.post("/quality-reports"') or line.startswith('@api_router.post("/violations"'):
            for j in range(i, i+30):
                print(f'{j+1}: {lines[j].strip()}')
            print('---')

print_post_endpoints()
