with open("server.py", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if 'safety-reports' in line or 'business-reports' in line or 'violations' in line.lower():
            print(f"Line {i+1}: {line.strip()}")
