import os
import re

files_to_check = [
    'ConsultantNotes.js', 'Contractors.js', 'SafetyReports.js', 'QualityReports.js',
    'Reports.js', 'Extracts.js', 'Invoices.js', 'EmployeeRequests.js', 'Employees.js',
    'ConsultantTeam.js', 'CompanyCars.js', 'UserManagement.js', 'Users.js'
]

# The spinner html that we want to inject if there is no text
# Wait, let's just find the h1 or h2 that has the title and inject it there, it's MUCH safer because
# some pages use different loading structures.
# But injecting into JSX via regex is tricky because of the closing tags.

# Alternatively, let's just find "Loading..." or "جاري التحميل..." and replace it.
# Let's do a regex replacement on anything that looks like a loading spinner text.

for file in files_to_check:
    path = f'frontend/src/pages/{file}'
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 1. Replace existing Loading texts
        content = re.sub(r"'جاري التحميل\.\.\.'", "'جاري تحميل البيانات...'", content)
        content = re.sub(r">جاري التحميل\.\.\.<", ">جاري تحميل البيانات...<", content)
        content = re.sub(r"'Loading\.\.\.'", "'Loading Data...'", content)
        content = re.sub(r">Loading\.\.\.<", ">Loading Data...<", content)
        
        # 2. In ConsultantNotes.js, the loading spinner has no text. Let's add it.
        if file == 'ConsultantNotes.js':
            spinner_target = '<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>'
            spinner_replacement = '<div className="flex flex-col items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div><span className="text-blue-600 font-medium animate-pulse">{t("common.loadingData", { defaultValue: "جاري تحميل البيانات..." })}</span></div>'
            content = content.replace(spinner_target, spinner_replacement)
            
        # 3. For any other file that has a generic spinner without text, let's try to add it.
        # It's safer to just let the user see it on the ones that had text. But let's add it carefully.
        
        if content != original_content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {file}")
