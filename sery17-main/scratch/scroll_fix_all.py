import os
import re

dir_path = 'd:/sery17-main/sery17-main/frontend/src/pages'

replacement = """const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }"""

# A more robust approach for JS files with window.scrollTo
# We'll just replace `window.scrollTo({ top: 0, behavior: 'smooth' });` 
# and `window.scrollTo(0, 0);` globally in all JS files

for root, _, files in os.walk(dir_path):
    for filename in files:
        if filename.endswith('.js'):
            filepath = os.path.join(root, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if 'window.scrollTo' in content:
                # Using lambda to return the replacement for multiple occurrences
                new_content = re.sub(r'window\.scrollTo\(\{\s*top:\s*0,\s*behavior:\s*\'smooth\'\s*\}\);?', replacement, content)
                new_content = re.sub(r'window\.scrollTo\(0,\s*0\);?', replacement, new_content)
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Fixed {filename}")

print("Done fixing scroll in all pages.")
