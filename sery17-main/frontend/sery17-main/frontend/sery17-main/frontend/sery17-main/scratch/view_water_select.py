with open("d:/sery17-main/sery17-main/frontend/src/pages/WaterConnections.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "filterGovernorates.map" in line and "WaterConnections" not in line:
        print(f"Match found at line {idx+1}: {line.strip()}")
        for k in range(idx - 5, idx + 10):
            print(f"{k+1}: {lines[k].rstrip()}")
        break
