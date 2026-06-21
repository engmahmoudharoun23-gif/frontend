import sys

with open('d:/sery17-main/sery17-main/frontend/src/pages/QualityReports.js', 'r', encoding='utf-8') as f:
    content = f.read()

parts = content.split('type="file"')
for i, p in enumerate(parts[1:]):
    idx = content.find(p)
    print(f"Input {i}:\n{content[idx-100:idx+150]}\n")
