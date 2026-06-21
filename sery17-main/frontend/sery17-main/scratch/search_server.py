with open('backend/server.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'safety-reports' in line.lower() or 'quality-reports' in line.lower() or 'safety_reports' in line.lower():
        print(f"Line {i+1}: {line.strip()}")
