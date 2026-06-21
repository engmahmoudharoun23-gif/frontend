import json

def update_json(filepath, lang):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    if 'statusMap' not in data:
        data['statusMap'] = {}
        
    if lang == 'en':
        data['statusMap']['رخصة غير صادرة'] = "License Not Issued"
        data['statusMap']['تمت المعالجة بواسطة الاستشاري'] = "Processed by Consultant"
    else:
        data['statusMap']['رخصة غير صادرة'] = "رخصة غير صادرة"
        data['statusMap']['تمت المعالجة بواسطة الاستشاري'] = "تمت المعالجة بواسطة الاستشاري"
        
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

update_json('frontend/src/i18n/locales/en.json', 'en')
update_json('frontend/src/i18n/locales/ar.json', 'ar')
