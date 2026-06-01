import os
import re

file_path = r"d:\sery17-main\sery17-main\backend\server.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# الدوال التي تحتوي على تصدير Excel
functions_to_update = [
    "async def export_selected_reports_excel",
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

for func in functions_to_update:
    # البحث عن بداية الدالة ومكان wb.save داخلها
    # نستخدم regex للبحث عن الدالة حتى wb.save التالي لها
    pattern = re.compile(rf"{func}.*?wb\.save\(output\)", re.DOTALL)
    
    matches = list(pattern.finditer(content))
    if matches:
        # نأخذ أول تطابق لكل دالة
        match = matches[0]
        original_text = match.group(0)
        if "manager_name =" not in original_text:
            # استبدال wb.save(output) بالكود الجديد + wb.save(output)
            # نحافظ على نفس المسافة البادئة
            updated_text = original_text.replace("wb.save(output)", insertion_code + "    wb.save(output)")
            content = content.replace(original_text, updated_text)
            print(f"Updated {func}")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
