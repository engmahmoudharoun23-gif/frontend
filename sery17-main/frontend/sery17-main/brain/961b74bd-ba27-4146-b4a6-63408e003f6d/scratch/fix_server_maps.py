import os

file_path = r'd:\sery17-main\sery17-main\backend\server.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_map = 'collection_map = {"invoice": db.invoices, "employee_request": db.employee_requests, "report": db.reports}'
new_map = """collection_map = {
        "invoice": db.invoices, 
        "employee_request": db.employee_requests, 
        "report": db.reports,
        "extract": db.extracts
    }"""

# Replace all occurrences (there should be two)
if old_map in content:
    new_content = content.replace(old_map, new_map)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully replaced.")
else:
    print("Old map not found.")
