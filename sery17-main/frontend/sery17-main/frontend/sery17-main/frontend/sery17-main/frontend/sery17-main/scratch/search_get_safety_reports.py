with open('backend/server.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'def get_safety_reports' in line:
        for j in range(i, i + 35):
            print(lines[j], end='')
