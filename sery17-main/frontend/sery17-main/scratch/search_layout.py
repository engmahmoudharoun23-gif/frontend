with open('frontend/src/components/Layout.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'safety' in line.lower() or 'quality' in line.lower():
        print(f"Line {i+1}: {line.strip()}")
