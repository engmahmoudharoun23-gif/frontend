with open('backend/server.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'upload' in line.lower() and ('def ' in line or 'route' in line or 'api_router' in line):
        print(f"Line {i+1}: {line.strip()}")
