with open('frontend/src/pages/Settings.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'storage/upload' in line:
        print(f"Line {i+1}: {line.strip()}")
        # print surrounding lines
        for j in range(max(0, i-5), min(len(lines), i+15)):
            print(f"  {j+1}: {lines[j]}", end='')
