import os
import re

files_config = {
    'ConsultantNotes.js': 'reports',
    'Contractors.js': 'contractors',
    'EmployeeRequests.js': 'requests',
    'Extracts.js': 'extracts',
    'Invoices.js': 'invoices',
    'QualityReports.js': 'reports',
    'SafetyReports.js': 'reports',
    'TeamManagement.js': 'teams',
    'Users.js': 'users',
    'Cars.js': 'cars',
    'BusinessReports.js': 'reports',
    'SupportMessages.js': 'messages',
    'Trash.js': 'deletedItems', # usually it's items or reports. Let's skip Trash and SupportMessages for the script, I'll do them manually if needed.
}

frontend_pages_dir = 'frontend/src/pages'

for filename, var_name in files_config.items():
    filepath = os.path.join(frontend_pages_dir, filename)
    if not os.path.exists(filepath):
        print(f"Skipping {filename}, not found.")
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Replace useState([]) with cached initializer
    # e.g., const [reports, setReports] = useState([]);
    
    # regex to find the state declaration
    state_pattern = r'const \[' + var_name + r', set' + var_name.capitalize() + r'\] = useState\(\[\]\);'
    
    replacement = f"""const getInitial{var_name.capitalize()} = () => {{
    try {{
      const cached = sessionStorage.getItem('cache_{filename}_{var_name}');
      if (cached) return JSON.parse(cached);
    }} catch (e) {{}}
    return [];
  }};
  const [{var_name}, set{var_name.capitalize()}] = useState(getInitial{var_name.capitalize()});"""
    
    if 'getInitial' + var_name.capitalize() not in content:
        content = re.sub(state_pattern, replacement, content)
        
        # update the loading state right after it
        loading_pattern = r'const \[loading, setLoading\] = useState\(false\);'
        content = re.sub(loading_pattern, f'const [loading, setLoading] = useState({var_name}.length === 0);', content)
        
        # now find the setter, e.g., setReports(data) or setReports(res.data) inside a fetch function
        # this is tricky because the API response path varies. 
        # I'll just find `setVarName(something);` and add sessionStorage below it.
        # But wait, it might be in multiple places. It's safer to just inject it manually or use a more precise regex.
        
        # Another approach: find `setVarName(...)` where it sets the main array.
        setter_pattern = r'(set' + var_name.capitalize() + r'\(([^)]+)\);)'
        def setter_replacer(match):
            full_match = match.group(1)
            inner_arg = match.group(2)
            # ignore if it's an empty array or functional update
            if inner_arg.strip() == '[]' or 'prev' in inner_arg or '=>' in inner_arg:
                return full_match
            
            return f"""{full_match}
      try {{ sessionStorage.setItem('cache_{filename}_{var_name}', JSON.stringify({inner_arg})); }} catch(e) {{}}"""
            
        content = re.sub(setter_pattern, setter_replacer, content)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filename}")
    else:
        print(f"Already updated {filename}")
