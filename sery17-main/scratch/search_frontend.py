import os

root_dir = 'frontend/src'
for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                if '/storage/upload' in content or 'storage/upload' in content:
                    print(f"Found in {filepath}")
