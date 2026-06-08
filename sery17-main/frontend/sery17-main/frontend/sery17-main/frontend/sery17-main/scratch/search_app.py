with open('frontend/src/App.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'safety-reports' in line.lower() or 'safetyreports' in line.lower():
        print(f"Line {i+1}: {line.strip()}")
