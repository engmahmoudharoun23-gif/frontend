with open('backend/server.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(489, min(515, len(lines))):
    print(f"{i+1}: {lines[i]}", end='')
