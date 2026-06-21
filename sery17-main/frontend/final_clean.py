"""
Final brute-force cleanup: replace the entire triggerAsyncTranslation function
in each target file with a no-op version.
Uses line-by-line approach to find and delete the function block.
"""
import os
import re

PAGES = [
    r"d:\sery17-main\sery17-main\frontend\src\pages\Contractors.js",
    r"d:\sery17-main\sery17-main\frontend\src\pages\NewDashboard.js",
    r"d:\sery17-main\sery17-main\frontend\src\pages\ReportForm.js",
    r"d:\sery17-main\sery17-main\frontend\src\pages\Reports.js",
    r"d:\sery17-main\sery17-main\frontend\src\pages\SewageConnections.js",
    r"d:\sery17-main\sery17-main\frontend\src\pages\WaterConnections.js",
]

def remove_function_block(content, func_name):
    """Remove a function definition block by finding matching braces."""
    # Find the start of the function
    pattern = re.compile(r'const\s+' + func_name + r'\s*=\s*\([^)]*\)\s*=>\s*\{')
    match = pattern.search(content)
    if not match:
        return content
    
    start = match.start()
    # Find opening brace position
    brace_start = content.index('{', match.end() - 1)
    depth = 0
    i = brace_start
    while i < len(content):
        if content[i] == '{':
            depth += 1
        elif content[i] == '}':
            depth -= 1
            if depth == 0:
                # Found the closing brace
                end = i + 1
                # Skip optional semicolon and newline
                while end < len(content) and content[end] in ';\n\r ':
                    if content[end] in '\n\r':
                        end += 1
                        break
                    end += 1
                return content[:start] + content[end:]
        i += 1
    return content

for filepath in PAGES:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Remove all occurrences (there may be multiple if patched multiple times)
    for _ in range(5):
        new_content = remove_function_block(content, 'triggerAsyncTranslation')
        if new_content == content:
            break
        content = new_content
    
    # Also remove lingering mymemory references (comments, cache)
    content = re.sub(r'// 5\. Trigger asynchronous fetch to MyMemory.*?\n', '\n', content)
    content = re.sub(r'\s*triggerAsyncTranslation\([^)]*\)\s*;', '', content)
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Cleaned: {os.path.basename(filepath)}")
    else:
        print(f"No change: {os.path.basename(filepath)}")

print("\nFinal verification:")
for filepath in PAGES:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    hits = [l.strip() for l in content.splitlines() if 'mymemory' in l.lower() and 'return;' not in l.lower() and 'disabled' not in l.lower()]
    if hits:
        print(f"  WARNING - still has live MyMemory calls in {os.path.basename(filepath)}:")
        for h in hits:
            print(f"    {h}")
    else:
        print(f"  OK: {os.path.basename(filepath)}")
