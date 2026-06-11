import os

def insert_after(file_path, target_string, insert_string):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    if insert_string.strip(", ") not in content:
        content = content.replace(target_string, target_string + insert_string)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}")

def main():
    base = os.path.join('d:\\', 'sery17-main', 'sery17-main', 'frontend', 'src')
    
    # 1. Update Users.js
    users_js = os.path.join(base, 'pages', 'Users.js')
    insert_after(users_js, "'business_reports_delete', 'business_reports_review', 'consultant_close',", "\n    'work_permits', 'work_permits_edit', 'work_permits_delete',")
    
    # 2. Update utils/permissions.js
    perms_js = os.path.join(base, 'utils', 'permissions.js')
    insert_after(perms_js, "'business_reports_review'", ",\n  'work_permits', 'work_permits_edit', 'work_permits_delete'")
    
if __name__ == "__main__":
    main()
