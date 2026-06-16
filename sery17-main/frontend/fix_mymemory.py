import os
import glob
import re

frontend_dir = r"d:\sery17-main\sery17-main\frontend\src"

# Regex to match the triggerAsyncTranslation function and replace its contents
# It looks for: const triggerAsyncTranslation = (text) => { ... };
# We'll just search for the fetch call and comment it out or disable it.

for root, dirs, files in os.walk(frontend_dir):
    for file in files:
        if file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if 'api.mymemory.translated.net' in content:
                print(f"Fixing {filepath}")
                # Replace the fetch call with nothing, or just return early in the function
                # The function usually starts with: const triggerAsyncTranslation = (text) => {
                # Let's replace `const triggerAsyncTranslation = (text) => {` 
                # with `const triggerAsyncTranslation = (text) => { return;`
                
                # Some might have `(text, isRtl)` or `(text, langpair)`
                content = re.sub(
                    r'(const\s+triggerAsyncTranslation\s*=\s*\([^)]*\)\s*=>\s*\{)',
                    r'\1\n  return; // Disabled MyMemory API\n',
                    content
                )
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

print("Done fixing MyMemory API in all files.")
