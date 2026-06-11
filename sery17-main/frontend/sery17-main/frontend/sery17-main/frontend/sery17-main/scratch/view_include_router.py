with open('backend/server.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(14310, min(14350, len(lines))):
    print(f"{i+1}: {lines[i]}", end='')
