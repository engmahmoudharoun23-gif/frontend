import re

with open('backend/server.py', 'r', encoding='utf-8') as f:
    content = f.read()

# For export_selected_reports_pdf and export_reports_pdf
# We'll use regex to replace the headers, row generation, and col_widths.

def patch_pdf_export(text):
    # 1. Replace headers
    old_headers = r'''headers = \[
\s*"رقم", "المحافظة", "المشروع", "رقم البلاغ", "رقم الرخصة", "حالة الرخصة",
\s*"الحالة", "نوع البلاغ", "العمق", "القطر", "المقاول", "تاريخ الإنشاء"
\s*\]'''
    new_headers = '''headers = [
        "رقم", "المحافظة", "المشروع", "رقم البلاغ", "رقم الرخصة", 
        "الحالة", "خط العرض", "خط الطول", "نوع البلاغ", "المقاول", "تاريخ الإنشاء"
    ]'''
    
    text = re.sub(old_headers, new_headers, text)

    # 2. Replace row generation
    old_row = r'''row = \[
\s*Paragraph\(date_str, latin_cell_style\),.*?
\s*Paragraph\(arabic_text\(report\.get\('contractor'\) or ''\), cell_style\),.*?
\s*Paragraph\(diameter_str, latin_cell_style\),.*?
\s*Paragraph\(depth_str, latin_cell_style\),.*?
\s*Paragraph\(arabic_text\(report\.get\('report_type'\) or ''\), cell_style\),.*?
\s*Paragraph\(arabic_text\(report\.get\('status'\) or ''\), cell_style\),.*?
\s*Paragraph\(arabic_text\("مغلقة بواسطة الاستشاري"\) if report\.get\('wfm_closed'\) else arabic_text\("قيد المعالجة"\), cell_style\),.*?
\s*Paragraph\(arabic_text\(license_num\), cell_style\),.*?
\s*Paragraph\(report_num, latin_cell_style\),.*?
\s*Paragraph\(arabic_text\(shorten_project_name\(report\.get\('project'\) or ''\)\), cell_style\),.*?
\s*Paragraph\(arabic_text\(report\.get\('governorate'\) or ''\), cell_style\),.*?
\s*Paragraph\(str\(idx\), latin_cell_style\).*?
\s*\]'''
    
    new_row = '''row = [
            Paragraph(date_str, latin_cell_style),  # تاريخ الإنشاء - يمين
            Paragraph(arabic_text(report.get('contractor') or ''), cell_style),  # المقاول
            Paragraph(arabic_text(report.get('report_type') or ''), cell_style),  # نوع البلاغ
            Paragraph(str(lng) if lng else '-', latin_cell_style),  # خط الطول
            Paragraph(str(lat) if lat else '-', latin_cell_style),  # خط العرض
            Paragraph(arabic_text(report.get('status') or ''), cell_style),  # الحالة
            Paragraph(arabic_text(license_num), cell_style),  # رقم الرخصة
            Paragraph(report_num, latin_cell_style),  # رقم البلاغ مع CCP-
            Paragraph(arabic_text(shorten_project_name(report.get('project') or '')), cell_style),  # المشروع
            Paragraph(arabic_text(report.get('governorate') or ''), cell_style),  # المحافظة
            Paragraph(str(idx), latin_cell_style)  # رقم - يسار
        ]'''
    
    text = re.sub(old_row, new_row, text, flags=re.DOTALL)

    # 3. Replace col_widths
    old_col_widths = r'''col_widths = \[50, 70, 35, 35, 50, 125, 85, 50, 110, 120, 35, 20\]'''
    new_col_widths = '''col_widths = [50, 70, 50, 45, 45, 125, 95, 110, 140, 35, 20]'''
    
    text = re.sub(old_col_widths, new_col_widths, text)
    
    return text

new_content = patch_pdf_export(content)

with open('backend/server.py', 'w', encoding='utf-8') as f:
    f.write(new_content)

if new_content != content:
    print("Successfully patched backend/server.py")
else:
    print("Failed to patch or no changes needed.")
