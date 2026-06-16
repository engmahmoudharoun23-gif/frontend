import re

with open('backend/server.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace col_widths with slightly wider lat/long columns
old_col_widths = r'col_widths = \[50, 70, 50, 45, 45, 125, 95, 110, 140, 35, 20\]'
new_col_widths = 'col_widths = [50, 70, 50, 55, 55, 125, 95, 110, 140, 35, 20]'

content = re.sub(old_col_widths, new_col_widths, content)

with open('backend/server.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
