from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os
import io

try:
    output = io.BytesIO()
    doc = SimpleDocTemplate(output)
    elements = []
    
    # Register Arabic font
    font_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', 'fonts', 'NotoSansArabic-Regular.ttf')
    pdfmetrics.registerFont(TTFont('ArabicFont', font_path))
    
    style = ParagraphStyle(
        'TestStyle',
        fontName='ArabicFont',
        fontSize=12,
        leading=14
    )
    
    # Test Arabic and Latin text
    text1 = "CCP-12345"
    text2 = "غير محدد"
    
    elements.append(Paragraph(text1, style))
    elements.append(Paragraph(text2, style))
    
    doc.build(elements)
    print("SUCCESS: NotoSansArabic-Regular compiled both Latin and Arabic text without error!")
except Exception as e:
    print(f"FAILED with error: {type(e).__name__}: {e}")
