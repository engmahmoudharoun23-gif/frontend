import os

file_path = r'd:\sery17-main\sery17-main\backend\server.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the collection truth testing
old_pattern = 'if not collection:'
new_pattern = 'if collection is None:'

if old_pattern in content:
    new_content = content.replace(old_pattern, new_pattern)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully fixed collection truth testing.")
else:
    print("Pattern 'if not collection:' not found.")
