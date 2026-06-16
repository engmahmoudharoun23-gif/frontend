with open('backend/server.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'ALL_PERMISSIONS = [' in line:
        print(f"ALL_PERMISSIONS starts at line {i+1}")
        # print next 50 lines
        for j in range(i, i+55):
            print(f"  {j+1}: {lines[j]}", end='')
    if 'PROJECT_SCOPED_PERMISSIONS = {' in line:
        print(f"PROJECT_SCOPED_PERMISSIONS starts at line {i+1}")
        for j in range(i, i+25):
            print(f"  {j+1}: {lines[j]}", end='')
