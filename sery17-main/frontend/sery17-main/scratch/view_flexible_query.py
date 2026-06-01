with open('backend/server.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'def get_flexible_in_query' in line:
        for j in range(i, i + 30):
            print(lines[j], end='')
