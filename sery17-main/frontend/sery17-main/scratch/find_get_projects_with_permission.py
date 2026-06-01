with open("d:/sery17-main/sery17-main/backend/server.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "def get_projects_with_permission" in line:
        print(f"Match found at line {idx+1}: {line.strip()}")
        # print 40 lines after
        for k in range(idx, min(idx + 40, len(lines))):
            print(f"  {k+1}: {lines[k].rstrip()}")
        print("-" * 30)
        break
