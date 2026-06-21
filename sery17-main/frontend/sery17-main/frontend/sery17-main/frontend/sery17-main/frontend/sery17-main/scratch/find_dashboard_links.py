with open("d:/sery17-main/sery17-main/frontend/src/pages/NewDashboard.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "project=" in line or "projectName" in line or "/connections" in line or "navigate" in line:
        print(f"Line {idx+1}: {line.strip()}")
        # print 5 lines around
        for k in range(max(0, idx - 3), min(idx + 5, len(lines))):
            print(f"  {k+1}: {lines[k].rstrip()}")
        print("-" * 30)
