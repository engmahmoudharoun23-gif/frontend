import os
import re

frontend_pages_dir = 'frontend/src/pages'

for filename in os.listdir(frontend_pages_dir):
    if not filename.endswith('.js'):
        continue
        
    filepath = os.path.join(frontend_pages_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Replace non-commented setLoading(true) with // setLoading(true)
    # We use regex to ensure it's not already commented
    new_content = re.sub(r'(?<!// )(?<!//)setLoading\(true\)', r'// setLoading(true)', content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Commented out setLoading(true) in {filename}")
