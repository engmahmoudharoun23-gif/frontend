import json
with open('scratch/db_projects_exact.txt', 'rb') as f:
    content = f.read()
    text = content.decode('utf-16' if content.startswith(b'\xff\xfe') else 'utf-8')
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    with open('scratch/projects_final.json', 'w', encoding='utf-8') as f2:
        json.dump(lines, f2, ensure_ascii=False, indent=2)
