with open("d:/sery17-main/sery17-main/frontend/src/pages/Users.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Searching for created_by in Users.js...")
found = False
for idx, line in enumerate(lines):
    if "created_by" in line.lower() or "createdby" in line.lower() or "parent" in line.lower():
        print(f"Line {idx+1}: {line.strip()}")
        found = True

if not found:
    print("No occurrences of created_by / createdBy / parent found in Users.js!")
