import re
with open('d:/sery17-main/sery17-main/backend/server.py', 'r', encoding='utf-8') as f:
    code = f.read()

# Try different patterns
pattern = r'@app\.(get|post|put|delete)\('
matches = list(re.finditer(pattern, code))
print(f"Total route decorators: {len(matches)}")

# Get lines around first few
for m in matches[:5]:
    line_num = code[:m.start()].count('\n') + 1
    line = code.split('\n')[line_num-1].strip()
    print(f"Line {line_num}: {line}")
