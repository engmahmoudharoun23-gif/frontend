import os
import re

filepath = 'd:/sery17-main/sery17-main/frontend/src/pages/Reports.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace window.scrollTo(...) with proper main scroll
replacement = """const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }"""

# Need to replace different variants
content = re.sub(r'window\.scrollTo\(\{ top: 0, behavior: \'smooth\' \}\);', replacement, content)
content = re.sub(r'window\.scrollTo\(0,\s*0\);', replacement, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done replacing window.scrollTo in Reports.js")
