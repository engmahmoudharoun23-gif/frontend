
import sys
import os

path = "d:/sery17-main/sery17-main/backend/server.py"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

target = '            query["governorate"] = {"$in": current_user.governorates}\n'
replacement = """            query.update(get_flexible_in_query(current_user.governorates, "governorate"))
        
        # تطبيق الفلترة الهرمية للتحليل
        hierarchy_filter = await get_hierarchy_filter(current_user)
        query.update(hierarchy_filter)
        
        # تطبيق فلترة المشاريع بمرونة
        if current_user.projects:
            query.update(get_flexible_in_query(current_user.projects, "project"))
"""

found = False
for i, line in enumerate(lines):
    if 'query["governorate"] = {"$in": current_user.governorates}' in line and 11090 < i < 11110:
        lines[i] = replacement
        found = True
        print(f"Patched at line {i+1}")
        break

if found:
    with open(path, "w", encoding="utf-8") as f:
        f.writelines(lines)
else:
    print("Target not found")
