import json
with open('scratch/report_projects_output.txt', 'rb') as f:
    content = f.read()
    # Write to JSON for clean viewing
    lines = content.decode('utf-16' if content.startswith(b'\xff\xfe') else 'utf-8').splitlines()
    print(json.dumps(lines, ensure_ascii=False, indent=2))
