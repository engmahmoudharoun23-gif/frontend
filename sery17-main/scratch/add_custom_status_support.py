import os

file_path = r"d:\sery17-main\sery17-main\backend\server.py"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    new_lines.append(line)
    if 'query["status"] = {"$regex": "لا يوجد تسريب", "$options": "i"}' in line:
        # إضافة دعم الحالات المخصصة بعد "لا يوجد تسريب" مباشرة
        indent = line[:line.find('query')]
        new_lines.append(f'{indent[:-4]}elif license_status and str(license_status).startswith("custom_"):\n')
        new_lines.append(f'{indent}query["status"] = str(license_status).replace("custom_", "", 1)\n')

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)
