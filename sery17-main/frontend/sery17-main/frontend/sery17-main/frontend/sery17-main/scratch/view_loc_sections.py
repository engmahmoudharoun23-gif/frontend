import json

with open('frontend/src/i18n/locales/ar.json', 'r', encoding='utf-8') as f:
    ar = json.load(f)

with open('frontend/src/i18n/locales/en.json', 'r', encoding='utf-8') as f:
    en = json.load(f)

print("AR permissionsList:")
print(json.dumps(ar.get("users", {}).get("permissionsList", {}), indent=2, ensure_ascii=False))

print("EN permissionsList:")
print(json.dumps(en.get("users", {}).get("permissionsList", {}), indent=2, ensure_ascii=False))

print("AR safetyReports:")
print(json.dumps(ar.get("safetyReports", {}), indent=2, ensure_ascii=False))

print("EN safetyReports:")
print(json.dumps(en.get("safetyReports", {}), indent=2, ensure_ascii=False))
