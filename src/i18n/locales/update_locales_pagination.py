import json

for lang in ['en', 'ar']:
    with open(f'{lang}.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if 'reports' not in data:
        data['reports'] = {}
        
    data['reports']['page'] = "صفحة" if lang == 'ar' else "Page"
    data['reports']['of'] = "من" if lang == 'ar' else "of"
    data['reports']['showing'] = "عرض" if lang == 'ar' else "Showing"
    data['reports']['reportsOfTotal'] = "بلاغات من إجمالي" if lang == 'ar' else "reports out of total"
    data['reports']['reportsPerPage'] = "عدد البلاغات في الصفحة" if lang == 'ar' else "Reports per page"

    with open(f'{lang}.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Updated {lang}.json")
