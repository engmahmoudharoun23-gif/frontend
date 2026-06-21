
import os

path = r'd:\sery17-main\sery17-main\backend\server.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update manager info text
# Matching whatever version might be there to be safe
content = content.replace('manager_info_text = "إعداد م / محمود هارون مدير النظام وتحليل البيانات"', 'manager_info_text = "تنفيذ م/ محمود هارون - مدير النظام وتحليل البيانات"')
content = content.replace('manager_info_text = "اعداد م/ محمود هارون - مدير النظام وتحليل البيانات"', 'manager_info_text = "تنفيذ م/ محمود هارون - مدير النظام وتحليل البيانات"')

# Update footer page numbering
content = content.replace('reshape_arabic(f"صفحة {doc.page}")', 'reshape_arabic(f"صفحة رقم {doc.page}")')

# Update signatures alignment
old_sig_style = """        sig_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),"""

new_sig_style = """        sig_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),"""

content = content.replace(old_sig_style, new_sig_style)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Final PDF polish complete.")
