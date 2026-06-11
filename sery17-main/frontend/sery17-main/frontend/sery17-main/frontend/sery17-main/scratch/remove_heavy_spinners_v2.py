import os
import re

pages_dir = r"d:\sery17-main\sery17-main\frontend\src\pages"
app_file = r"d:\sery17-main\sery17-main\frontend\src\App.js"

light_spinner = '<div className="flex items-center justify-center py-20 text-gray-500 text-sm font-medium"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span className="mr-2">{typeof isRtl !== \'undefined\' && !isRtl ? \'Loading...\' : \'جاري التحميل...\'}</span></div>'

heavy_spinner_regex_3 = r'<div className="flex flex-col items-center justify-center p-10 py-16 w-full"><div className="relative flex justify-center items-center w-16 h-16 mb-4">[\s\S]*?</span></div>'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    content = re.sub(heavy_spinner_regex_3, light_spinner, content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Downgraded spinner in {os.path.basename(filepath)}")

if os.path.exists(app_file):
    process_file(app_file)

for root, _, files in os.walk(pages_dir):
    for file in files:
        if file.endswith(".js"):
            process_file(os.path.join(root, file))

print("Done making everything lightweight.")
