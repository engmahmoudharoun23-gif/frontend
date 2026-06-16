import os
import re

filepath = 'frontend/src/pages/HRManagement.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

variables = ['employees', 'contracts', 'attendances', 'salaries', 'advancesCustodies']

for var_name in variables:
    capitalized = var_name[0].upper() + var_name[1:]
    
    replacement = f"""const getInitial{capitalized} = () => {{
    try {{
      const cached = localStorage.getItem('cache_HRManagement.js_{var_name}');
      if (cached) return JSON.parse(cached);
    }} catch (e) {{}}
    return [];
  }};
  const [{var_name}, set{capitalized}] = useState(getInitial{capitalized});"""
    
    state_pattern = r'const \[' + var_name + r', set' + capitalized + r'\] = useState\(\[\]\);'
    
    if f'getInitial{capitalized}' not in content:
        content = re.sub(state_pattern, replacement, content)
        
        # Now find the setter inside the fetch function
        setter_pattern = r'(set' + capitalized + r'\(([^)]+)\);)'
        def setter_replacer(match):
            full_match = match.group(1)
            inner_arg = match.group(2)
            if inner_arg.strip() == '[]' or 'prev' in inner_arg or '=>' in inner_arg:
                return full_match
            return f"""{full_match}
      try {{ localStorage.setItem('cache_HRManagement.js_{var_name}', JSON.stringify({inner_arg})); }} catch(e) {{}}"""
        
        content = re.sub(setter_pattern, setter_replacer, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated HRManagement.js caching")
