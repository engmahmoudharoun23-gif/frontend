import json

for lang in ['en', 'ar']:
    with open(f'{lang}.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if 'reports' not in data:
        data['reports'] = {}
        
    data['reports']['exportSelectedNote'] = "أزرار التصدير أعلاه ستعمل على المحدد فقط" if lang == 'ar' else "Export buttons above will apply only to the selected items"
    data['reports']['selectedCount'] = "{{count}} report(s) selected" if lang == 'en' else "تم تحديد {{count}} بلاغ"

    with open(f'{lang}.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Updated {lang}.json")
