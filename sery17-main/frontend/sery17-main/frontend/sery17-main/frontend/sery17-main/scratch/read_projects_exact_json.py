import json
with open('scratch/db_projects_exact.txt', 'rb') as f:
    content = f.read()
    text = content.decode('utf-16' if content.startswith(b'\xff\xfe') else 'utf-8')
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    print(json.dumps(lines, ensure_ascii=False, indent=2))
