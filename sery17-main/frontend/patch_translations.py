import os
import re

frontend_dir = r"d:\sery17-main\sery17-main\frontend\src"

new_branding = """  'عاجل .. نأسف علي الازعاج المنصة قيد التطوير شكرا': 'Urgent.. We apologize for the inconvenience, the platform is under development. Thank you.',
  'عاجل .. نأسف على الازعاج المنصة قيد التطوير شكرا': 'Urgent.. We apologize for the inconvenience, the platform is under development. Thank you.',
  'م/ مدحت حسين محمد': 'Eng. Medhat Hussein Mohamed',
  'م/مدحت حسين محمد': 'Eng. Medhat Hussein Mohamed',
  'م. مدحت حسين محمد': 'Eng. Medhat Hussein Mohamed',
  'م مدحت حسين محمد': 'Eng. Medhat Hussein Mohamed',
  'م. أحمد عبيدات': 'Eng. Ahmed Obeidat',
  'م أحمد عبيدات': 'Eng. Ahmed Obeidat',
  'م/ أحمد عبيدات': 'Eng. Ahmed Obeidat',
  'م/أحمد عبيدات': 'Eng. Ahmed Obeidat',
  'م/ احمد عبيدات': 'Eng. Ahmed Obeidat',
  'الوطنية.': 'National.',"""

new_locals = """  'م': 'Eng.',
  'م.': 'Eng.',
  'مدحت': 'Medhat',
  'شوقي': 'Shawky',
  'عبدالمنعم': 'Abdel Moneim',
  'طائفي': 'Taifi',
  'ميهران': 'Mehran',
  'أمين': 'Amin',
  'مختار': 'Mokhtar',
  'عبدالحفيظ': 'Abdel Hafiz',
  'عبيدات': 'Obeidat',
  'حافظ': 'Hafez',
  'هارون': 'Haroun',
  'عاجل': 'Urgent',
  'نأسف': 'Sorry',
  'الازعاج': 'Inconvenience',
  'المنصة': 'Platform',
  'التطوير': 'Development',
  'شكرا': 'Thanks',
  'قيد': 'Under',"""

for root, dirs, files in os.walk(frontend_dir):
    for file in files:
        if file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            changed = False
            
            # Insert into BRANDING_TRANSLATIONS_EN
            if 'const BRANDING_TRANSLATIONS_EN = {' in content:
                # Check if we already inserted one of them to avoid duplicates
                if "'م/ مدحت حسين محمد': 'Eng. Medhat Hussein Mohamed'," not in content:
                    content = content.replace(
                        'const BRANDING_TRANSLATIONS_EN = {',
                        f"const BRANDING_TRANSLATIONS_EN = {{\n{new_branding}"
                    )
                    changed = True

            # Insert into localWordsMap
            if 'const localWordsMap = {' in content:
                if "'مدحت': 'Medhat'," not in content:
                    content = content.replace(
                        'const localWordsMap = {',
                        f"const localWordsMap = {{\n{new_locals}"
                    )
                    changed = True

            if changed:
                print(f"Adding new translations to {filepath}")
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

print("Done patching translations in all files.")
