import re
lines = open(r'd:\sery17-main\sery17-main\backend\server.py', encoding='utf-8').readlines()
for i, l in enumerate(lines):
    if '/projects' in l and '@api_router.get' in l:
        print(f'{i}: {l.strip()}')
