import json

for lang in ['en', 'ar']:
    with open(f'{lang}.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if 'reports' not in data:
        data['reports'] = {}
        
    data['reports']['exportExcelWithCount'] = "تصدير Excel ({{count}})" if lang == 'ar' else "Export Excel ({{count}})"
    data['reports']['exportPdfWithCount'] = "تصدير PDF ({{count}})" if lang == 'ar' else "Export PDF ({{count}})"
    data['reports']['deleteSelectedWithCount'] = "حذف المحدد ({{count}})" if lang == 'ar' else "Delete Selected ({{count}})"

    with open(f'{lang}.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Updated {lang}.json")
