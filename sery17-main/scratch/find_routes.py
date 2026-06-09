with open("server.py", "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "safety" in line.lower() or "business-reports" in line.lower() or "business_reports" in line.lower():
            print(f"Line {i+1}: {line.strip()}")
