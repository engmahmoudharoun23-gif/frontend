import os

file_path = r'd:\sery17-main\sery17-main\backend\server.py'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Standardize Logo Sizes to 45x22mm
content = content.replace('width=40*mm, height=20*mm', 'width=45*mm, height=22*mm')

# 2. Deep clean of any electronic signature text
# Use a list of variations to be sure
variations = [
    '(توقيع إلكتروني)',
    'توقيع إلكتروني',
    '(توقيع الكتروني)',
    'توقيع الكتروني',
    'توقيع إلكتروني:',
    'التوقيع الإلكتروني'
]

for var in variations:
    content = content.replace(var, '')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Final cleanup and logo standardization completed.")
