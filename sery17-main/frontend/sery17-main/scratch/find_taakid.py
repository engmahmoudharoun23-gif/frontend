import os

lines = open('d:/sery17-main/sery17-main/frontend/src/components/Layout.js', encoding='utf-8').readlines()
for i, line in enumerate(lines):
    if 'تأكيد' in line or 'تاكيد' in line:
        print(f'{i+1}: {line.strip()}')
