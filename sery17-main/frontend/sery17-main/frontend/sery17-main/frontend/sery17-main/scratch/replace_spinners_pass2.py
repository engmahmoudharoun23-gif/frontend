import os
import re

pages_dir = r"d:\sery17-main\sery17-main\frontend\src\pages"

spinner_div = '<div className="flex flex-col items-center justify-center p-8"><svg className="w-10 h-10 animate-spin text-primary mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Catch remaining variations of {t('common.loading')} or {t('workPermits.loading')} in generic divs
    content = re.sub(r'<div[^>]*>\{t\(\'(common|workPermits)\.loading\'\)\}<\/div>', spinner_div, content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {os.path.basename(filepath)}")

for root, _, files in os.walk(pages_dir):
    for file in files:
        if file.endswith(".js"):
            process_file(os.path.join(root, file))

print("Done second pass replacing loading states.")
