with open('frontend/src/App.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(319, min(355, len(lines))):
    print(f"{i+1}: {lines[i]}", end='')
