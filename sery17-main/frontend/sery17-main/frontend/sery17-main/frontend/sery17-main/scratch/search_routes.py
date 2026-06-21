with open("d:/sery17-main/sery17-main/backend/server.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Searching for routes...")
for idx, line in enumerate(lines):
    if "/users" in line or "/auth/register" in line or "async def get_users" in line or "class UserResponse" in line:
        print(f"Line {idx+1}: {line.strip()}")
