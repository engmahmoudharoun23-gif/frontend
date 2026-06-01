import sys
import re

# 1. Fix PDF Column Widths in server_recovered.py
server_path = 'backend/server_recovered.py'
with open(server_path, 'r', encoding='utf-8') as f:
    content = f.read()

# The width we want to increase: report_number (CCB-), status, and project
old_widths = r"col_widths = \[65, 75, 50, 50, 65, 85, 75, 85, 105, 60, 28\]"
new_widths = "col_widths = [65, 75, 45, 45, 65, 95, 70, 95, 130, 65, 30]"

content = re.sub(old_widths, new_widths, content)

with open(server_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed backend PDF widths!")

# 2. Fix Pagination Limit Issue in Reports.js
reports_path = 'frontend/src/pages/Reports.js'
with open(reports_path, 'r', encoding='utf-8') as f:
    reports_content = f.read()

# Let's fix the select onChange
old_select = """                  onChange={(e) => {
                    setReportsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}"""
new_select = """                  onChange={(e) => handleLimitChange(Number(e.target.value))}"""

if old_select in reports_content:
    reports_content = reports_content.replace(old_select, new_select)
    print("Fixed Reports.js pagination select!")
else:
    print("Could not find the select onChange in Reports.js")

with open(reports_path, 'w', encoding='utf-8') as f:
    f.write(reports_content)
