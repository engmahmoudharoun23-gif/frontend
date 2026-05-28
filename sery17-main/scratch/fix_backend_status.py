import os

file_path = r"d:\sery17-main\sery17-main\backend\server.py"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if 'query["status"] = "تم الاصلاح - تسريب"' in line:
        new_lines.append(line.replace('"تم الاصلاح - تسريب"', '{"$regex": "تم ال[اإ]صلاح.*تسريب", "$options": "i"}'))
    elif 'query["status"] = "لا يوجد تسريب"' in line:
        new_lines.append(line.replace('"لا يوجد تسريب"', '{"$regex": "لا يوجد تسريب", "$options": "i"}'))
    else:
        new_lines.append(line)

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)
