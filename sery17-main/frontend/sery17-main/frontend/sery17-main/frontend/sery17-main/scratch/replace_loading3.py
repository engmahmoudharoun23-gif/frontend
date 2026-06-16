import os
import re

files_to_check = ['HRManagement.js', 'TeamManagement.js', 'Cars.js']

for file in files_to_check:
    path = f'frontend/src/pages/{file}'
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        content = re.sub(r"'جاري التحميل\.\.\.'", "'جاري تحميل البيانات...'", content)
        content = re.sub(r">جاري التحميل\.\.\.<", ">جاري تحميل البيانات...<", content)
        content = re.sub(r"'Loading\.\.\.'", "'Loading Data...'", content)
        content = re.sub(r">Loading\.\.\.<", ">Loading Data...<", content)
        
        if file == 'Cars.js':
            old = "{t('carsPage.loading')}"
            new = '<div className="flex flex-col items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div><span className="text-blue-600 font-medium animate-pulse">{t("common.loadingData", { defaultValue: "جاري تحميل البيانات..." })}</span></div>'
            content = content.replace(old, new)
            
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {file}')
