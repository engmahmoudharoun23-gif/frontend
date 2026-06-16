import json
import os

ar_path = 'frontend/src/i18n/locales/ar.json'
en_path = 'frontend/src/i18n/locales/en.json'

with open(ar_path, 'r', encoding='utf-8') as f:
    ar_data = json.load(f)

if 'sidebar' not in ar_data:
    ar_data['sidebar'] = {}
ar_data['sidebar']['consultantNotes'] = 'ملاحظات الاستشاري'

with open(ar_path, 'w', encoding='utf-8') as f:
    json.dump(ar_data, f, ensure_ascii=False, indent=2)

with open(en_path, 'r', encoding='utf-8') as f:
    en_data = json.load(f)

if 'sidebar' not in en_data:
    en_data['sidebar'] = {}
en_data['sidebar']['consultantNotes'] = 'Consultant Notes'

with open(en_path, 'w', encoding='utf-8') as f:
    json.dump(en_data, f, ensure_ascii=False, indent=2)

print("Locales updated.")
