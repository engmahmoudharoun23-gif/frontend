import json

def update_translation(file_path, lang):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        if "workPermits" in data:
            work_permits = data["workPermits"]
            for k, v in work_permits.items():
                if isinstance(v, str):
                    if lang == 'ar':
                        v = v.replace("تقارير السلامة", "temp_safety").replace("تقرير السلامة", "temp_safety_singular")
                        v = v.replace("تقارير", "تصاريح").replace("التقارير", "التصاريح")
                        v = v.replace("تقرير", "تصريح").replace("التقرير", "التصريح")
                        v = v.replace("temp_safety", "تقارير السلامة").replace("temp_safety_singular", "تقرير السلامة")
                    elif lang == 'en':
                        v = v.replace("Safety Reports", "temp_safety").replace("Safety Report", "temp_safety_singular")
                        v = v.replace("Reports", "Permits").replace("reports", "permits")
                        v = v.replace("Report", "Permit").replace("report", "permit")
                        v = v.replace("temp_safety", "Safety Reports").replace("temp_safety_singular", "Safety Report")
                    
                    work_permits[k] = v
            
            # Explicitly set saveBtn just in case
            if lang == 'ar':
                work_permits['saveBtn'] = 'إضافة تصريح'
                work_permits['editReport'] = 'تعديل التصريح'
                work_permits['deleteConfirm'] = 'هل أنت متأكد من حذف هذا التصريح؟'
                work_permits['downloadReport'] = 'تحميل التصريح'
                work_permits['noReports'] = 'لا توجد تصاريح مسجلة حتى الآن'
                work_permits['noFilteredReports'] = 'لا توجد تصاريح مطابقة للفلاتر الحالية'
                
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Updated {file_path}")
    except Exception as e:
        print(f"Error updating {file_path}: {e}")

if __name__ == "__main__":
    update_translation(r"d:\sery17-main\sery17-main\frontend\src\i18n\locales\ar.json", 'ar')
    update_translation(r"d:\sery17-main\sery17-main\frontend\src\i18n\locales\en.json", 'en')
