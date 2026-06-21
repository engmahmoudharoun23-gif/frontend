import json

with open('frontend/src/i18n/locales/ar.json', 'r', encoding='utf-8') as f:
    ar = json.load(f)

with open('frontend/src/i18n/locales/en.json', 'r', encoding='utf-8') as f:
    en = json.load(f)

result = {
    "ar_safety": ar.get("safetyReports", {}),
    "en_safety": en.get("safetyReports", {}),
    "ar_quality": ar.get("qualityReports", {}),
    "en_quality": en.get("qualityReports", {})
}

with open('scratch/reports_loc.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, indent=2, ensure_ascii=False)
