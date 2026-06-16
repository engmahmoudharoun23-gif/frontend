import os
import re

frontend_pages_dir = 'frontend/src/pages'

for filename in os.listdir(frontend_pages_dir):
    if not filename.endswith('.js'):
        continue
        
    filepath = os.path.join(frontend_pages_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Replace const [loading, setLoading] = useState(reports.length === 0); with useState(false);
    new_content = re.sub(r'const \[loading, setLoading\] = useState\([^)]+\.length === 0\);', r'const [loading, setLoading] = useState(false);', content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Set loading to false initially in {filename}")
