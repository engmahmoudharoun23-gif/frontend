import json

def update_translation(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        if "safetyReports" in data and "workPermits" not in data:
            work_permits = json.loads(json.dumps(data["safetyReports"]))
            # Translate specific keys
            work_permits["title"] = "تصاريح العمل" if "ar" in file_path else "Work Permits"
            work_permits["subTitle"] = "إدارة ومتابعة تصاريح العمل بالمشروع" if "ar" in file_path else "Manage and track work permits"
            work_permits["addNew"] = "إضافة تصريح عمل" if "ar" in file_path else "Add Work Permit"
            work_permits["goToSafety"] = "تقارير السلامة" if "ar" in file_path else "Safety Reports"
            
            data["workPermits"] = work_permits
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Updated {file_path}")
    except Exception as e:
        print(f"Error updating {file_path}: {e}")

if __name__ == "__main__":
    update_translation(r"d:\sery17-main\sery17-main\frontend\src\i18n\locales\ar.json")
    update_translation(r"d:\sery17-main\sery17-main\frontend\src\i18n\locales\en.json")
