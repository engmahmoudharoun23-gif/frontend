import os

file_path = r"d:\sery17-main\sery17-main\backend\server.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# الدوال التي تحتوي على تصدير Excel
functions_to_update = [
    "async def bulk_export_reports",
    "async def export_72h_reports",
    "async def export_reports_excel",
    "async def export_connections_excel",
    "async def export_sewage_connections_excel"
]

# الكود المراد إضافته قبل wb.save(output)
insertion_code = """
    # إضافة معلومات مدير النظام (ديناميكية)
    branding = await db.platform_settings.find_one({"key": "branding"}, {"_id": 0}) or {}
    manager_name = branding.get("system_manager_name", "م/ محمود هارون")
    manager_title = branding.get("system_manager_title", "مدير النظام")
    ws.append([]) # سطر فارغ
    last_row = ws.max_row + 1
    cell = ws.cell(row=last_row, column=1, value=f"إعداد {manager_name} - {manager_title}")
    cell.font = Font(bold=True, size=11)
"""

# البحث عن كل دالة وإضافة الكود قبل wb.save
import re

for func in functions_to_update:
    # البحث عن بداية الدالة ومكان wb.save داخلها
    func_pattern = re.compile(rf"{func}.*?wb\.save\(output\)", re.DOTALL)
    match = func_pattern.search(content)
    if match:
        original_text = match.group(0)
        if "manager_name =" not in original_text: # تجنب التكرار
            updated_text = original_text.replace("wb.save(output)", insertion_code + "    wb.save(output)")
            content = content.replace(original_text, updated_text)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
