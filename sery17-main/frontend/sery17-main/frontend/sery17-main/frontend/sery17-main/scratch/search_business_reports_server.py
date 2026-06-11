with open('backend/server.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'business-reports' in line or 'business_reports' in line:
        print(f"Line {i+1}: {line.strip()}")
