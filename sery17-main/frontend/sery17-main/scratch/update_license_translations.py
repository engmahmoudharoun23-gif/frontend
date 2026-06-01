import json

def add_translation(filepath, lang):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    if 'statusMap' not in data:
        data['statusMap'] = {}
        
    if lang == 'en':
        data['statusMap']['لم يتم اصدار رخصه'] = "License Not Issued"
        data['statusMap']['لم يتم اصدار رخصة'] = "License Not Issued"
        data['statusMap']['بدون رخصة'] = "No License"
        data['statusMap']['لا يوجد رخصة'] = "No License"
    else:
        data['statusMap']['لم يتم اصدار رخصه'] = "لم يتم إصدار رخصة"
        data['statusMap']['لم يتم اصدار رخصة'] = "لم يتم إصدار رخصة"
        data['statusMap']['بدون رخصة'] = "بدون رخصة"
        data['statusMap']['لا يوجد رخصة'] = "لا يوجد رخصة"
        
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

add_translation('frontend/src/i18n/locales/en.json', 'en')
add_translation('frontend/src/i18n/locales/ar.json', 'ar')
