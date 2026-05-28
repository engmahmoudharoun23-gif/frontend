with open("d:/sery17-main/sery17-main/backend/server.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "get_all_subordinate_user_ids" in line and "async def" in line:
        print(f"Match found at line {idx+1}: {line.strip()}")
        # print 50 lines after
        for k in range(idx, min(idx + 60, len(lines))):
            print(f"{k+1}: {lines[k].rstrip()}")
        break
