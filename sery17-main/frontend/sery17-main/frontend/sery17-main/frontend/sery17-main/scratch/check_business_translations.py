import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('frontend/src/i18n/locales/ar.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(json.dumps(data.get('businessReports', {}), indent=2, ensure_ascii=False))
