with open('backend/server.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Line 487 (0-indexed 486)
lines[486] = '    {"key": "quality_reports", "label": "تقارير الجودة", "group": "التقارير"},\n'
# Let's clean up line 488 to use proper Arabic label too
lines[487] = '    {"key": "business_reports", "label": "تقارير الأعمال", "group": "التقارير"},\n'

with open('backend/server.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Syntax error in server.py fixed!")
