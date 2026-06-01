import json

for lang in ['en', 'ar']:
    with open(f'{lang}.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if 'reports' not in data:
        data['reports'] = {}
        
    data['reports']['allProjectGovernorates'] = "جميع محافظات المشروع" if lang == 'ar' else "All Project Governorates"
    data['reports']['allAllowedGovernorates'] = "جميع المحافظات المسموح بها" if lang == 'ar' else "All Allowed Governorates"
    data['reports']['exportPreparing'] = "جاري تجهيز ملف التصدير..." if lang == 'ar' else "Preparing export file..."
    data['reports']['exportSuccess'] = "تم تصدير الملف بنجاح" if lang == 'ar' else "File exported successfully"
    data['reports']['exportTimeout'] = "انتهت مهلة التصدير - حاول تضييق نطاق التاريخ" if lang == 'ar' else "Export timeout - try narrowing the date range"
    data['reports']['exportError'] = "حدث خطأ في التصدير - حاول مرة أخرى" if lang == 'ar' else "Export error - please try again"
    data['reports']['byStatus'] = "حسب الحالة" if lang == 'ar' else "By Status"
    data['reports']['byReview'] = "حسب المراجعة" if lang == 'ar' else "By Review"
    data['reports']['byLicense'] = "حسب الرخصة" if lang == 'ar' else "By License"
    data['reports']['byProcessing'] = "حسب حالة المعالجة" if lang == 'ar' else "By Processing Status"

    with open(f'{lang}.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Updated {lang}.json")
