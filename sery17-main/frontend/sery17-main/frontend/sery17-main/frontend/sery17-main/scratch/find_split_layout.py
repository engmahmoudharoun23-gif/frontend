with open("d:/sery17-main/sery17-main/frontend/src/pages/NewDashboard.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "getSortedProjects()" in line:
        print(f"Match found at line {idx+1}: {line.strip()}")
        # print 50 lines before and after
        for k in range(max(0, idx - 30), min(idx + 35, len(lines))):
            print(f"  {k+1}: {lines[k].rstrip()}")
        print("-" * 30)
