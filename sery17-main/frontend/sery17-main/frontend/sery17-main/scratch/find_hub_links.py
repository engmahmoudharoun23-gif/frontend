with open("d:/sery17-main/sery17-main/frontend/src/pages/ConnectionsHub.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "sewage-connections" in line or "water-connections" in line:
        print(f"Line {idx+1}: {line.strip()}")
        for k in range(max(0, idx - 4), min(idx + 10, len(lines))):
            print(f"  {k+1}: {lines[k].rstrip()}")
        print("-" * 30)
