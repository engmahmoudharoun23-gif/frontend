with open("d:/sery17-main/sery17-main/frontend/src/pages/WaterConnections.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "fetchprojects" in line.lower() or "fetchcontractors" in line.lower():
        print(f"Line {idx+1}: {line.strip()}")
