with open("d:/sery17-main/sery17-main/frontend/src/pages/NewDashboard.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "const ProjectCard = " in line:
        for k in range(idx + 45, min(idx + 120, len(lines))):
            print(f"  {k+1}: {lines[k].rstrip()}")
        break
