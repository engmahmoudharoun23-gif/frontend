import os
import re

pages_dir = r"d:\sery17-main\sery17-main\frontend\src\pages"
app_file = r"d:\sery17-main\sery17-main\frontend\src\App.js"

spinner_div = '<div className="flex flex-col items-center justify-center p-8"><svg className="w-10 h-10 animate-spin text-primary mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 1. Dashboard style: <div className="text-xl text-gray-600">جاري التحميل...</div> or {t('common.loading')}
    content = re.sub(r'<div[^>]*>جاري التحميل\.\.\.<\/div>', spinner_div, content)
    content = re.sub(r'<div[^>]*>\{t\(\'common\.loading\'\)\}<\/div>', spinner_div, content)

    # 2. Table style: <tr><td ...>{t('common.loading')}</td></tr>
    def table_repl(match):
        pre = match.group(1)
        post = match.group(2)
        # return the same td structure but with spinner inside
        return f'{pre}{spinner_div}{post}'
    
    content = re.sub(r'(<td[^>]*>)\s*\{t\(\'common\.loading\'\)\}\s*(<\/td>)', table_repl, content)
    content = re.sub(r'(<td[^>]*>)\s*\{isRtl \? \'جاري التحميل\.\.\.\' : \'Loading\.\.\.\'\}\s*(<\/td>)', table_repl, content)

    # 3. Span style: <span ...>جاري التحميل...</span>
    content = re.sub(r'<span[^>]*>جاري التحميل\.\.\.<\/span>', spinner_div, content)
    content = re.sub(r'<span[^>]*>\{t\(\'users\.loadingUsers\'\)\}<\/span>', spinner_div, content)
    content = re.sub(r'<span[^>]*>\{t\(\'users\.loadingData\'\)\}<\/span>', spinner_div, content)

    # 4. generic div text-center text-gray-500
    content = re.sub(r'<div className="text-center py-4[^"]*">جاري التحميل\.\.\.<\/div>', spinner_div, content)
    content = re.sub(r'<div className="text-center py-8[^"]*">\{t\(\'supportMessages\.loading\'\)\}<\/div>', spinner_div, content)

    # Write back if changed
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {os.path.basename(filepath)}")

# process App.js
if os.path.exists(app_file):
    process_file(app_file)

# process all pages
for root, _, files in os.walk(pages_dir):
    for file in files:
        if file.endswith(".js"):
            process_file(os.path.join(root, file))

print("Done replacing loading states.")
