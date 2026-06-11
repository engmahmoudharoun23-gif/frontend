with open("d:/sery17-main/sery17-main/frontend/src/pages/WaterConnections.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "urlProject" in line or "const urlProject" in line:
        print(f"Match found at line {idx+1}: {line.strip()}")
        # print 5 lines before and after
        for k in range(max(0, idx - 5), min(idx + 10, len(lines))):
            print(f"  {k+1}: {lines[k].rstrip()}")
        print("-" * 30)
        break
