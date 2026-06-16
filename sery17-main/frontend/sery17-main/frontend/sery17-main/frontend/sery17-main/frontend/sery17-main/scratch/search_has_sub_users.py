with open("d:/sery17-main/sery17-main/backend/server.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "has_sub_users" in line:
        print(f"Line {idx+1}: {line.strip()}")
