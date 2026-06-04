import os
import re

pages_dir = r"d:\sery17-main\sery17-main\frontend\src\pages"
app_file = r"d:\sery17-main\sery17-main\frontend\src\App.js"

spinner_html = '<div className="flex flex-col items-center justify-center p-10 py-16 w-full"><div className="relative flex justify-center items-center w-16 h-16 mb-4"><div className="absolute w-full h-full rounded-full border-4 border-slate-100"></div><div className="absolute w-full h-full rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-500 animate-spin shadow-lg shadow-blue-100"></div><div className="absolute w-10 h-10 bg-gradient-to-tr from-blue-500 to-emerald-400 rounded-full animate-pulse shadow-inner blur-[1px]"></div></div><span className="text-[11px] font-black tracking-widest text-slate-400 uppercase animate-pulse">{typeof isRtl !== \'undefined\' && !isRtl ? \'Processing data...\' : \'جاري معالجة البيانات...\'}</span></div>'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    
    # 1. Update existing spinners to have translation
    content = re.sub(r'جاري معالجة البيانات\.\.\.', "{typeof isRtl !== 'undefined' && !isRtl ? 'Processing data...' : 'جاري معالجة البيانات...'}", content)
    
    # 2. Replace any <div className="...">{t('...loading')}</div>
    content = re.sub(r'<div className="text-center py-20 text-gray-400">\{t\(\'[a-zA-Z]+\.loading\'\)\}</div>', spinner_html, content)
    
    # 3. Replace any <div className="...text-center...text-gray-500...">{t('common.loading')}</div> (in tables)
    content = re.sub(r'<div className="p-8 text-center text-gray-500">\{t\(\'common\.loading\'\)\}</div>', spinner_html, content)
    
    # 4. Replace Trash.js specific loading
    content = re.sub(r'<div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">[\s\S]*?<div className="animate-spin[\s\S]*?</div>', spinner_html, content)

    # 5. Some files might have <div className="text-center py-20 text-gray-400">{t('common.loading')}</div>
    content = re.sub(r'<div className="text-center py-20 text-gray-400">\{t\(\'common\.loading\'\)\}</div>', spinner_html, content)
    
    # 6. Specific case for DeletedItems.js or others if they say "جاري التحميل..."
    content = re.sub(r'<div className="text-center py-20 text-gray-400">جاري التحميل\.\.\.</div>', spinner_html, content)

    # 7. Check table cells
    content = re.sub(r'<tr><td colSpan="[^"]+" className="px-6 py-4 text-center text-gray-500">\{t\(\'[a-zA-Z]+\.loading\'\)\}</td></tr>', f'<tr><td colSpan="14" className="px-6 py-4 text-center text-gray-500">{spinner_html}</td></tr>', content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {os.path.basename(filepath)}")

if os.path.exists(app_file):
    process_file(app_file)

for root, _, files in os.walk(pages_dir):
    for file in files:
        if file.endswith(".js"):
            process_file(os.path.join(root, file))

print("Done fixing all loading spinners.")
