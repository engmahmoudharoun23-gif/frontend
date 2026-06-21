with open('backend/server.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(14339, 14399):
    print(f"{i+1}: {lines[i]}", end='')
