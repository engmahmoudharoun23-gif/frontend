with open("d:/sery17-main/sery17-main/backend/server.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

with open("d:/sery17-main/sery17-main/scratch/connections_endpoints.txt", "w", encoding="utf-8") as out:
    for idx, line in enumerate(lines):
        if "/water-connections" in line or "/sewage-connections" in line:
            if "@api_router.get" in lines[idx-1] or "@api_router.get" in line:
                out.write(f"Match found at line {idx+1}: {line.strip()}\n")
                # print 120 lines after
                for k in range(idx, min(idx + 120, len(lines))):
                    out.write(f"{k+1}: {lines[k].rstrip()}\n")
                out.write("-" * 50 + "\n")
