with open('frontend/src/components/Layout.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(1559, min(1600, len(lines))):
    print(f"{i+1}: {lines[i]}", end='')
