with open("d:/sery17-main/sery17-main/backend/server.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

with open("d:/sery17-main/sery17-main/scratch/water_connections_code.txt", "w", encoding="utf-8") as out:
    for idx, line in enumerate(lines):
        if "async def get_water_connections" in line:
            for k in range(idx, min(idx + 180, len(lines))):
                out.write(f"{k+1}: {lines[k]}")
            break
