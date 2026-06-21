import os
import re

frontend_dir = r"d:\sery17-main\sery17-main\frontend\src"

cleanup_code = """    if (saved) {
      const parsed = JSON.parse(saved);
      let changed = false;
      Object.keys(parsed).forEach(k => {
        if (typeof parsed[k] === 'string' && parsed[k].includes('MYMEMORY')) {
          delete parsed[k];
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem('wfm_dynamic_branding_cache', JSON.stringify(parsed));
      }
      return parsed;
    }
    return {};"""

for root, dirs, files in os.walk(frontend_dir):
    for file in files:
        if file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # check if it has dynamicTranslationsCache
            if 'wfm_dynamic_branding_cache' in content:
                # Find the line returning JSON.parse
                if 'return saved ? JSON.parse(saved) : {};' in content:
                    print(f"Adding cache cleanup to {filepath}")
                    content = content.replace('return saved ? JSON.parse(saved) : {};', cleanup_code)
                    
                    # Also, let's inject missing translations into BRANDING_TRANSLATIONS_EN
                    new_translations = """  'م/ مدحت حسين محمد': 'Eng. Medhat Hussein Mohamed',
  'م مدحت حسين محمد': 'Eng. Medhat Hussein Mohamed',
  'مدحت حسين محمد': 'Medhat Hussein Mohamed',
  'م مدحت': 'Eng. Medhat',
  'الوطنية.': 'National.',"""
                    
                    # Try to insert them into BRANDING_TRANSLATIONS_EN
                    # We look for "const BRANDING_TRANSLATIONS_EN = {"
                    if 'const BRANDING_TRANSLATIONS_EN = {' in content:
                        content = content.replace(
                            'const BRANDING_TRANSLATIONS_EN = {',
                            f"const BRANDING_TRANSLATIONS_EN = {{\n{new_translations}"
                        )
                    
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)

print("Done fixing caches in all files.")
