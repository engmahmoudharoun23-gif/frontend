with open('backend/server.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(13360, 13385):
    print(f"{i+1}: {lines[i]}", end='')
