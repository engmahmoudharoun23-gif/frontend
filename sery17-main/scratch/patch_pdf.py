import os
import re

file_path = r"d:\sery17-main\sery17-main\backend\server.py"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# For export_selected_reports_pdf
content = re.sub(
    r'async def export_selected_reports_pdf\(\s*request: dict,\s*current_user: User = Depends\(get_current_user\)\s*\):',
    r'async def export_selected_reports_pdf(\n    request: dict,\n    current_user: User = Depends(get_current_user)\n):\n    lang = request.get("lang", "ar")',
    content,
    count=1
)

# For export_reports_pdf
content = re.sub(
    r'created_by: Optional\[str\] = Query\(None\),\s*current_user: User = Depends\(get_current_user\)\s*\):',
    r'created_by: Optional[str] = Query(None),\n    lang: Optional[str] = Query("ar"),\n    current_user: User = Depends(get_current_user)\n):',
    content,
    count=1
)

# Helper for translation
translate_func = """
    def t(text):
        if lang != 'en': return text
        trans = {
            "رقم": "No.", "المحافظة": "Governorate", "المشروع": "Project", 
            "رقم البلاغ": "Report No.", "رقم الرخصة": "License No.", "حالة الرخصة": "License Status",
            "الحالة": "Status", "نوع البلاغ": "Type", "العمق": "Depth", "القطر": "Diameter",
            "المقاول": "Contractor", "تاريخ الإنشاء": "Created At",
            "بلاغات محافظة": "Reports of Governorate", "لشهر": "for Month", "تقرير البلاغات": "Reports Report",
            "تنفيذ م-محمود محمد هارون مدير النظام وتحليل البيانات": "Implemented by Eng. Mahmoud Haroon - System & Data Manager",
            "شركة المياه الوطنية": "National Water Company", "مكتب بيت الخبرة للاستشارات الهندسية": "Bayt Al Khibra Eng. Consultancy",
            "الاسم: ........................": "Name: ........................",
            "التوقيع: ........................": "Signature: ........................",
            "قيد المعالجة": "In Progress", "مغلقة بواسطة الاستشاري": "Closed by Consultant",
            "لم يتم إصدار رخصة": "License Not Issued",
            "ايصال": "Esal", "ايصال الرياض": "Esal Riyadh",
            "مشروع كشف التسربات وإصلاحها": "Leak Detection & Repair Project",
            "مشروع المحافظات الغربية -القطاع الأوسط": "Western Governorates Project - Middle Sector",
            "مشروع المحافظات الشمالية": "Northern Governorates Project",
            "مشروع المحافظات الجنوبية": "Southern Governorates Project"
        }
        for k, v in trans.items():
            if text == k: return v
        
        if text.startswith("الاسم:"): return text.replace("الاسم:", "Name:")
        if text.startswith("بلاغات محافظة"): return text.replace("بلاغات محافظة", "Reports of Governorate").replace("لشهر", "for Month")
        
        return text

    def arabic_text(text):
        if not text: return ""
        text = t(text)
        try:
            if any("\u0600" <= c <= "\u06FF" for c in text):
                from arabic_reshaper import reshape
                from bidi.algorithm import get_display
                return get_display(reshape(text))
            return text
        except:
            return text
"""

# Replace arabic_text function in export_selected_reports_pdf
content = re.sub(
    r'    def arabic_text\(text\):\s+if not text:\s+return ""\s+try:\s+reshaped = reshape\(text\)\s+return get_display\(reshaped\)\s+except:\s+return text',
    translate_func,
    content,
    count=2 # replace in both endpoints if present
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
