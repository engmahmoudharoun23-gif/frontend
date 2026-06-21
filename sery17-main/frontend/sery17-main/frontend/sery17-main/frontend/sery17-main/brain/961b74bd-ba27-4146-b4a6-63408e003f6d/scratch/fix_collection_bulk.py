import os

file_path = r'd:\sery17-main\sery17-main\backend\server.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the collection truth testing in bulk delete
old_pattern = 'if collection and item_id:'
new_pattern = 'if collection is not None and item_id:'

if old_pattern in content:
    new_content = content.replace(old_pattern, new_pattern)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully fixed bulk collection truth testing.")
else:
    print("Pattern 'if collection and item_id:' not found.")
