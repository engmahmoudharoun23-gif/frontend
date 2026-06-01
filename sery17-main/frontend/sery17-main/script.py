import json, re

# 1. server.py
with open('backend/server.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_perms = """    {"key": "safety_reports_edit", "label": "تعديل تقرير سلامة", "group": "التقارير"},
    {"key": "safety_reports_delete", "label": "حذف تقرير سلامة", "group": "التقارير"},
    {"key": "quality_reports_edit", "label": "تعديل تقرير جودة", "group": "التقارير"},
    {"key": "quality_reports_delete", "label": "حذف تقرير جودة", "group": "التقارير"},
    {"key": "business_reports_edit", "label": "تعديل تقرير أعمال", "group": "التقارير"},
    {"key": "business_reports_delete", "label": "حذف تقرير أعمال", "group": "التقارير"},"""

if 'safety_reports_edit' not in content:
    content = content.replace(
        '{"key": "business_reports", "label": "تقارير الأعمال", "group": "التقارير"},',
        '{"key": "business_reports", "label": "تقارير الأعمال", "group": "التقارير"},\n' + new_perms
    )
    content = content.replace(
        '"safety_reports", "quality_reports", "business_reports"',
        '"safety_reports", "quality_reports", "business_reports", "safety_reports_edit", "safety_reports_delete", "quality_reports_edit", "quality_reports_delete", "business_reports_edit", "business_reports_delete"'
    )
    with open('backend/server.py', 'w', encoding='utf-8') as f:
        f.write(content)

# 2. Users.js
with open('frontend/src/pages/Users.js', 'r', encoding='utf-8') as f:
    u_content = f.read()

if 'safety_reports_edit' not in u_content:
    u_content = u_content.replace(
        "'safety_reports', 'quality_reports', 'business_reports',",
        "'safety_reports', 'quality_reports', 'business_reports', 'safety_reports_edit', 'safety_reports_delete', 'quality_reports_edit', 'quality_reports_delete', 'business_reports_edit', 'business_reports_delete',"
    )
    with open('frontend/src/pages/Users.js', 'w', encoding='utf-8') as f:
        f.write(u_content)

# 3. Locales
for file, tdict in [
    ('ar.json', {'safety_reports_edit':'تعديل تقرير سلامة','safety_reports_delete':'حذف تقرير سلامة','quality_reports_edit':'تعديل تقرير جودة','quality_reports_delete':'حذف تقرير جودة','business_reports_edit':'تعديل تقرير أعمال','business_reports_delete':'حذف تقرير أعمال'}),
    ('en.json', {'safety_reports_edit':'Edit Safety Report','safety_reports_delete':'Delete Safety Report','quality_reports_edit':'Edit Quality Report','quality_reports_delete':'Delete Quality Report','business_reports_edit':'Edit Business Report','business_reports_delete':'Delete Business Report'})
]:
    with open(f'frontend/src/i18n/locales/{file}', 'r', encoding='utf-8') as f:
        data = json.load(f)
    if 'permissions' not in data: data['permissions'] = {}
    data['permissions'].update(tdict)
    with open(f'frontend/src/i18n/locales/{file}', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# 4. Wrap Edit/Delete buttons in the three reports pages
has_perm_func = '''
  const hasPermission = (permKey) => {
    if (user?.role === 'admin') return true;
    if ((user?.permissions || []).includes(permKey)) return true;
    const pp = user?.project_permissions || {};
    return Object.values(pp).some(perms => (perms || []).includes(permKey));
  };
'''

for page, pref in [('SafetyReports.js', 'safety'), ('QualityReports.js', 'quality'), ('BusinessReports.js', 'business')]:
    path = f'frontend/src/pages/{page}'
    with open(path, 'r', encoding='utf-8') as f:
        p_content = f.read()
    
    if 'const hasPermission' not in p_content:
        p_content = p_content.replace('const [reports, setReports] = useState([]);', 'const [reports, setReports] = useState([]);' + has_perm_func)
    
    # Replace openEdit
    if f"hasPermission('{pref}_reports_edit')" not in p_content:
        edit_regex = re.compile(r'(<DropdownMenuItem\s+onClick=\{\(\) => openEdit\(r\)\}[\s\S]*?</DropdownMenuItem>)')
        p_content = edit_regex.sub(rf"{{hasPermission('{pref}_reports_edit') && (\n                                    \1\n                                  )}}", p_content)
        
        del_regex = re.compile(r'(<DropdownMenuItem\s+onClick=\{\(\) => handleDelete\(r\.id\)\}[\s\S]*?</DropdownMenuItem>)')
        p_content = del_regex.sub(rf"{{hasPermission('{pref}_reports_delete') && (\n                                    \1\n                                  )}}", p_content)
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(p_content)

print("All updates done successfully!")
