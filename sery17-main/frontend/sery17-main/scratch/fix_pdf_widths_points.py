import os

file_path = r"d:\sery17-main\sery17-main\backend\server.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. تحديث col_widths في التصدير المختار
old_1 = "col_widths = [65, 75, 50, 50, 65, 85, 75, 85, 140, 60, 28]"
new_1 = "col_widths = [60, 70, 45, 45, 60, 80, 70, 80, 110, 60, 25]" # المجموع 705
content = content.replace(old_1, new_1)

# 2. تحديث col_widths في التصدير العام
old_2 = "col_widths = [65, 75, 50, 50, 65, 85, 75, 85, 105, 60, 28]"
new_2 = "col_widths = [60, 70, 45, 45, 60, 80, 70, 80, 105, 60, 25]" # المجموع 700
content = content.replace(old_2, new_2)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
