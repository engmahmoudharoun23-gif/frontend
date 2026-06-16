
import os
import re

path = r'd:\sery17-main\sery17-main\backend\server.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update export_reports_pdf (8590) Header area
# Add line and date
old_logo_end = 'elements.append(logo_table)\n    elements.append(Spacer(1, 5*mm))'
new_header_extras = """    elements.append(logo_table)
    elements.append(Spacer(1, 2*mm))
    
    # خط فاصل
    line_table = Table([['']], colWidths=[page_width])
    line_table.setStyle(TableStyle([('LINEBELOW', (0, 0), (-1, -1), 1, colors.HexColor('#366092'))]))
    elements.append(line_table)
    
    # تاريخ الاستخراج تحت الخط على اليمين
    from datetime import datetime
    date_style = ParagraphStyle('DateStyle', fontName='Arabic', fontSize=10, alignment=TA_RIGHT, textColor=colors.HexColor('#666666'))
    elements.append(Paragraph(get_display(reshape(f"تاريخ الاستخراج: {datetime.now().strftime('%Y-%m-%d')}")), date_style))
    elements.append(Spacer(1, 5*mm))"""

content = content.replace(old_logo_end, new_header_extras)

# 2. Add manager info to reports
old_title_style = """    title_style = ParagraphStyle(
        'ArabicTitle',
        fontName='Arabic',
        fontSize=16,  # تصغير حجم العنوان
        alignment=TA_CENTER,
        textColor=colors.HexColor('#366092'),
        spaceBefore=0,
        spaceAfter=8,  # تقليل المسافة بعد العنوان
        leading=20
    )"""

new_title_plus_manager = old_title_style + """
    
    manager_info_text = "تنفيذ م/ محمود هارون - مدير النظام وتحليل البيانات"
    manager_style = ParagraphStyle('Manager', fontName='Arabic', fontSize=8, alignment=TA_RIGHT, textColor=colors.HexColor('#366092'), spaceAfter=10)"""

content = content.replace(old_title_style, new_title_plus_manager)

# 3. Add manager paragraph after title
old_title_para = 'elements.append(Paragraph(get_display(reshape(report_title)), title_style))'
new_title_para = 'elements.append(Paragraph(get_display(reshape(report_title)), title_style))\n    elements.append(Paragraph(get_display(reshape(manager_info_text)), manager_style))'

content = content.replace(old_title_para, new_title_para)

# 4. Add footer function to reports
old_build = 'doc.build(elements)'
new_build = """    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont('Arabic', 8)
        canvas.drawCentredString(landscape(A4)[0]/2.0, 10*mm, get_display(reshape(f"صفحة رقم {doc.page}")))
        canvas.restoreState()

    doc.build(elements, onFirstPage=footer, onLaterPages=footer)"""

content = content.replace(old_build, new_build)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Reports PDF polish complete.")
