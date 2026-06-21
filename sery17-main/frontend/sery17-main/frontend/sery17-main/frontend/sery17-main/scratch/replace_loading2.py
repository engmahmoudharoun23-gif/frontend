import os
import re

updates = {
    'Contractors.js': [
        ('{t(\'contractorsPage.loading\')}', '<div className="flex flex-col items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div><span className="text-blue-600 font-medium animate-pulse">{t("common.loadingData", { defaultValue: "جاري تحميل البيانات..." })}</span></div>')
    ],
    'Extracts.js': [
        ('<div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>', '<div className="flex flex-col items-center"><div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mb-4"></div><span className="text-purple-600 font-medium animate-pulse">{t("common.loadingData", { defaultValue: "جاري تحميل البيانات..." })}</span></div>')
    ],
    'Invoices.js': [
        ('<div className="animate-spin h-8 w-8 mx-auto border-4 border-blue-600 border-t-transparent rounded-full"></div>', '<div className="flex flex-col items-center"><div className="animate-spin h-8 w-8 mx-auto border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div><span className="text-blue-600 font-medium animate-pulse">{t("common.loadingData", { defaultValue: "جاري تحميل البيانات..." })}</span></div>')
    ],
    'EmployeeRequests.js': [
        ('<div className="animate-spin h-8 w-8 mx-auto border-4 border-blue-600 border-t-transparent rounded-full"></div>', '<div className="flex flex-col items-center"><div className="animate-spin h-8 w-8 mx-auto border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div><span className="text-blue-600 font-medium animate-pulse">{t("common.loadingData", { defaultValue: "جاري تحميل البيانات..." })}</span></div>')
    ]
}

for file, replacements in updates.items():
    path = f'frontend/src/pages/{file}'
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        for old, new in replacements:
            content = content.replace(old, new)
            
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {file}')
