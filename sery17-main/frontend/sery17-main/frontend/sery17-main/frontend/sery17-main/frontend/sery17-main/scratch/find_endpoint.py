with open("d:/sery17-main/sery17-main/backend/server.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for k in range(2780, min(2830, len(lines))):
    print(f"{k+1}: {lines[k].strip()}")
