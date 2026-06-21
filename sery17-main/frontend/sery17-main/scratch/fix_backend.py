import codecs

file_path = 'backend/server.py'
with codecs.open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = 'Depends(get_current_active_user)'
replacement = 'Depends(get_current_user)'

content = content.replace(target, replacement)

with codecs.open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed Depends in backend.")
