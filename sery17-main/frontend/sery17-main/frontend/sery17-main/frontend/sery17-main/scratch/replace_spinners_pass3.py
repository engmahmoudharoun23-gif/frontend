import os
import re

pages_dir = r"d:\sery17-main\sery17-main\frontend\src\pages"
app_file = r"d:\sery17-main\sery17-main\frontend\src\App.js"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    content = content.replace('text-primary', 'text-blue-600')

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

print("Done fixing text-primary to text-blue-600.")
