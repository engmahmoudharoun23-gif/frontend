import sys
import os

files = [
    'd:/sery17-main/sery17-main/frontend/src/pages/SafetyReports.js',
    'd:/sery17-main/sery17-main/frontend/src/pages/WorkPermits.js',
    'd:/sery17-main/sery17-main/frontend/src/components/ViolationsModal.js',
    'd:/sery17-main/sery17-main/frontend/src/pages/QualityReports.js'
]

hint_text = """<p className="text-xs text-gray-400 mb-3">{isRtl ? 'يتم ضغط الصور تلقائياً إلى 100KB والـ PDF إلى 150KB' : 'Images auto-compressed to 100KB, PDFs to 150KB'}</p>"""

for fp in files:
    if os.path.exists(fp):
        with open(fp, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # remove existing occurrences
        content = content.replace(hint_text + '\n                ', "")
        content = content.replace(hint_text + '\n', "")
        content = content.replace(hint_text, "")
        
        target = '<div className="flex gap-4 mb-4">'
        replacement = hint_text + '\n                ' + target
        
        new_content = content.replace(target, replacement)
        
        with open(fp, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"Patched {fp}")
