import json

with open('frontend/src/i18n/locales/ar.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Print a subset of keys to see format
print("Top-level keys:", list(data.keys()))
if 'safetyReports' in data:
    print("safetyReports keys:", list(data['safetyReports'].keys()))
if 'reports' in data:
    print("reports keys:", list(data['reports'].keys()))
