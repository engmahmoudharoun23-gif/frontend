with open("d:/sery17-main/sery17-main/frontend/src/pages/SewageConnections.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "governorate" in line.lower():
        print(f"Line {idx+1}: {line.strip()}")
