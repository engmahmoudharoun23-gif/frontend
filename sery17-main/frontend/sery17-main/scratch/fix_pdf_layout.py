import os

file_path = r"d:\sery17-main\sery17-main\backend\server.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. إزالة الكود الخاطئ في منتصف الملف
content = content.replace('\n# إنشاء الجدول بذكاء (مجموع العرض يجب أن يكون أقل من 267 ملم للهوامش 15 ملم)\ncol_widths = [10*mm, 25*mm, 40*mm, 25*mm, 25*mm, 25*mm, 20*mm, 15*mm, 15*mm, 35*mm, 30*mm]\n\n', '')

# 2. تصحيح العروض في export_selected_reports_pdf (موجود كمتغير)
old_widths_1 = "col_widths = [10*mm, 25*mm, 45*mm, 25*mm, 25*mm, 25*mm, 20*mm, 15*mm, 15*mm, 35*mm, 30*mm]"
new_widths_1 = "col_widths = [10*mm, 25*mm, 40*mm, 25*mm, 25*mm, 25*mm, 20*mm, 15*mm, 15*mm, 35*mm, 30*mm]"
content = content.replace(old_widths_1, new_widths_1)

# 3. تصحيح العروض في export_reports_pdf (موجود كمعطى للدالة Table)
old_widths_2 = "colWidths=[10*mm, 25*mm, 45*mm, 25*mm, 25*mm, 25*mm, 20*mm, 15*mm, 15*mm, 35*mm, 30*mm]"
new_widths_2 = "colWidths=[10*mm, 25*mm, 40*mm, 25*mm, 25*mm, 25*mm, 20*mm, 15*mm, 15*mm, 35*mm, 30*mm]"
content = content.replace(old_widths_2, new_widths_2)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
