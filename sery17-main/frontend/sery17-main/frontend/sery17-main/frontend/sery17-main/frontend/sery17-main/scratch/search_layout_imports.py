with open('frontend/src/components/Layout.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'lucide-react' in line:
        print(f"Line {i+1}: {line.strip()}")
