with open("d:/sery17-main/sery17-main/frontend/src/pages/WaterConnections.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "const [filters" in line or "filters = useState" in line:
        print(f"Match found at line {idx+1}: {line.strip()}")
        # print 20 lines after
        for k in range(idx, min(idx + 25, len(lines))):
            print(f"  {k+1}: {lines[k].rstrip()}")
        print("-" * 30)
        break
