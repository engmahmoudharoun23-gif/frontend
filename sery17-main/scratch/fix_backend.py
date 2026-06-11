import sys

with open('d:/sery17-main/sery17-main/backend/server.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix the incorrect insertion around line 14905
if 'updates = {}' in lines[14905]:
    del lines[14905:14909]

# Find update_work_permit
idx = -1
for i, line in enumerate(lines):
    if '@api_router.put("/work-permits/{permit_id}")' in line:
        idx = i
        break

if idx != -1:
    for i in range(idx, idx+30):
        if 'updates = {}' in lines[i]:
            if 'images' not in lines[i+1]:
                lines[i+1] = lines[i+1].replace('"image",', '"image", "images",')
            break

with open('d:/sery17-main/sery17-main/backend/server.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Patched successfully')
