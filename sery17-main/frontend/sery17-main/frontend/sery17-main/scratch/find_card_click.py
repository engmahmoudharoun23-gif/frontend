with open("d:/sery17-main/sery17-main/frontend/src/pages/NewDashboard.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "ProjectCard" in line or "<ProjectCard" in line:
        print(f"Line {idx+1}: {line.strip()}")
        # print 50 lines around
        for k in range(max(0, idx - 5), min(idx + 50, len(lines))):
            print(f"  {k+1}: {lines[k].rstrip()}")
        print("-" * 30)
        break
