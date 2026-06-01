
import sys
import os
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER
from reportlab.lib.units import mm
import arabic_reshaper
from bidi.algorithm import get_display
import io
from datetime import datetime

def test_pdf():
    output = io.BytesIO()
    doc = SimpleDocTemplate(output, pagesize=landscape(A4), rightMargin=15, leftMargin=15, topMargin=15, bottomMargin=15)
    elements = []

    # Mock data
    consultant_name = "مكتب بيت الخبرة للاستشارات الهندسية"
    partner_name = "شركة المياه الوطنية"
    manager_info_text = "اعداد م/ محمود هارون - مدير النظام وتحليل البيانات"
    report_title = "تقرير سجلات توصيلات المياه"
    
    # Registration
    fonts_dir = r'd:\sery17-main\sery17-main\backend\fonts'
    arabic_font_path = os.path.join(fonts_dir, 'NotoSansArabic-Regular.ttf')
    pdfmetrics.registerFont(TTFont('Arabic', arabic_font_path))

    def reshape_arabic(text):
        if not text: return ""
        return get_display(arabic_reshaper.reshape(str(text)))

    title_style = ParagraphStyle('Title', fontName='Arabic', fontSize=18, alignment=TA_CENTER, textColor=colors.HexColor('#1F4E79'), spaceAfter=5)
    header_label_style = ParagraphStyle('HLabel', fontName='Arabic', fontSize=11, alignment=TA_CENTER, textColor=colors.HexColor('#333333'), leading=14)
    manager_style = ParagraphStyle('Manager', fontName='Arabic', fontSize=12, alignment=TA_CENTER, textColor=colors.HexColor('#1F4E79'), spaceAfter=5)
    subtitle_style = ParagraphStyle('Subtitle', fontName='Arabic', fontSize=10, alignment=TA_CENTER, textColor=colors.HexColor('#666666'), spaceAfter=15)

    def add_header(elements, doc, report_title):
        usable_width = landscape(A4)[0] - 40
        
        logo_data = [['', '', '']]
        h_table = Table(logo_data, colWidths=[usable_width*0.35, usable_width*0.3, usable_width*0.35])
        elements.append(h_table)
        
        names_data = [
            [Paragraph(reshape_arabic(consultant_name), header_label_style), '', Paragraph(reshape_arabic(partner_name), header_label_style)],
            ['', Paragraph(reshape_arabic(manager_info_text), manager_style), '']
        ]
        n_table = Table(names_data, colWidths=[usable_width*0.35, usable_width*0.3, usable_width*0.35])
        elements.append(n_table)
        elements.append(Spacer(1, 5*mm))
        
        line_table = Table([['']], colWidths=[usable_width])
        line_table.setStyle(TableStyle([('LINEBELOW', (0, 0), (-1, -1), 1, colors.HexColor('#1F4E79'))]))
        elements.append(line_table)
        elements.append(Spacer(1, 8*mm))
        
        elements.append(Paragraph(reshape_arabic(report_title), title_style))
        elements.append(Paragraph(reshape_arabic(f"تاريخ الاستخراج: {datetime.now().strftime('%Y-%m-%d')}"), subtitle_style))

    add_header(elements, doc, report_title)
    
    # Table mock
    headers = ['تاريخ التنفيذ', 'الحالة', 'القطر', 'المنطقة / الحي', 'المقاول', 'المحافظة', 'العميل', 'رقم CCB', 'رقم الطلب', 'م']
    table_data = [[reshape_arabic(h) for h in headers]]
    table_data.append(['2023-01-01', reshape_arabic('جديد'), '110', reshape_arabic('حي النزهة'), reshape_arabic('المقاول الأول'), reshape_arabic('الرياض'), reshape_arabic('عميل تجريبي'), '12345', '67890', '1'])
    
    table = Table(table_data, colWidths=[80, 70, 50, 120, 95, 80, 140, 70, 70, 25])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, -1), 'Arabic'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(table)

    doc.build(elements)
    print("PDF generated successfully")

if __name__ == "__main__":
    test_pdf()
