with open('frontend/src/pages/Users.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'project_scoped' in line.lower() or 'projectscoped' in line.lower():
        print(f"Line {i+1}: {line.strip()}")
