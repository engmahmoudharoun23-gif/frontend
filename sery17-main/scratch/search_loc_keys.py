with open('frontend/src/i18n/locales/ar.json', 'r', encoding='utf-8') as f:
    ar_content = f.read()

import json
ar_data = json.loads(ar_content)

def find_key(data, target, path=''):
    if isinstance(data, dict):
        for k, v in data.items():
            find_key(v, target, f"{path}.{k}" if path else k)
    elif isinstance(data, list):
        for idx, item in enumerate(data):
            find_key(item, target, f"{path}[{idx}]")
    else:
        if target in str(data) or target in str(path):
            print(f"Path: {path} = {data}")

find_key(ar_data, 'safety_reports')
find_key(ar_data, 'safety-reports')
find_key(ar_data, 'تقارير السلامة')
