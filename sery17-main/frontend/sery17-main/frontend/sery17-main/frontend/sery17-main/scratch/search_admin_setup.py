import os

files = ['backend/setup_admin.py', 'backend/setup_admin_v2.py']
for file in files:
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        print(f"--- {file} ---")
        for line in content.splitlines():
            if 'pass' in line.lower() or 'user' in line.lower():
                print(line.strip())
