import json
with open('scratch/db_projects_exact.txt', 'rb') as f:
    content = f.read()
    text = content.decode('utf-16' if content.startswith(b'\xff\xfe') else 'utf-8')
    print(text)
