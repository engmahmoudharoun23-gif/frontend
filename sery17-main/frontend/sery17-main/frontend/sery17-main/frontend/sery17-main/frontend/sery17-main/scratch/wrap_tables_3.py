import os
import re

directory = 'd:/sery17-main/sery17-main/frontend/src/pages'

def is_wrapped(lines, index):
    # Check if a few lines before has overflow-x-auto
    for j in range(max(0, index-4), index):
        if 'overflow-x-auto' in lines[j]:
            return True
    return False

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            lines = content.split('\n')
            new_lines = []
            i = 0
            
            wrapped_tables_stack = []
            modified = False
            
            while i < len(lines):
                line = lines[i]
                
                # Check for table open
                if re.search(r'<\s*table\b', line) and '`' not in line:
                    if not is_wrapped(lines, i):
                        indent = re.match(r'(\s*)', line).group(1)
                        new_lines.append(indent + '<div className="overflow-x-auto w-full">')
                        new_lines.append(line)
                        wrapped_tables_stack.append(True)
                        modified = True
                    else:
                        new_lines.append(line)
                        wrapped_tables_stack.append(False)
                # Check for table close
                elif re.search(r'<\s*/table\s*>', line) and '`' not in line:
                    new_lines.append(line)
                    if wrapped_tables_stack:
                        was_wrapped = wrapped_tables_stack.pop()
                        if was_wrapped:
                            indent = re.match(r'(\s*)', line).group(1)
                            new_lines.append(indent + '</div>')
                            modified = True
                else:
                    new_lines.append(line)
                i += 1
                
            if modified:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write('\n'.join(new_lines))
                print(f"Modified: {file}")
