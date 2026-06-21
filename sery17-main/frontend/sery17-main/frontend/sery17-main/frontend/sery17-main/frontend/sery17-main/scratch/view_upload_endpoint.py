with open('backend/server.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(13320, 13360):
    print(f"{i+1}: {lines[i]}", end='')
