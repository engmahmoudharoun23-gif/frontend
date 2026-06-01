import os
import re

directory = 'd:/sery17-main/sery17-main/frontend/src/pages'

for root, dirs, files in os.walk(directory):
    for file in files:
        if file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Use regex to find <table ...> and </table>, wrap them in <div className="overflow-x-auto w-full">...</div>
            # But only if they are not already wrapped in <div className="overflow-x-auto
            
            lines = content.split('\n')
            new_lines = []
            i = 0
            while i < len(lines):
                line = lines[i]
                
                # If we find a table start tag that is NOT inside a string literal like `<table>`
                if re.search(r'<\s*table\b', line) and '`' not in line:
                    # check if the previous lines have overflow-x-auto within a few lines before it
                    has_wrapper = False
                    for j in range(max(0, i-3), i):
                        if 'overflow-x-auto' in lines[j] or 'overflow-hidden' in lines[j]:
                            # Actually, if it has overflow-hidden but NOT overflow-x-auto, we should add overflow-x-auto
                            # So let's check for overflow-x-auto specifically
                            if 'overflow-x-auto' in lines[j]:
                                has_wrapper = True
                                break
                    
                    if not has_wrapper:
                        indent = re.match(r'(\s*)', line).group(1)
                        new_lines.append(indent + '<div className="overflow-x-auto w-full">')
                        new_lines.append(line)
                    else:
                        new_lines.append(line)
                elif re.search(r'<\s*/table\s*>', line) and '`' not in line:
                    # We need to figure out if we wrapped it. The safest way is to count how many we wrapped
                    # but since this is stateless, let's look back to see if we wrapped the corresponding table
                    # A robust way is to just do it statefully:
                    pass
                i += 1
                
