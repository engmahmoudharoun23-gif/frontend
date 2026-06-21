"""
Fix all pages that have a broken local translateBrandingText or translateDynamicText
that references undefined variables after the deep_clean.py removed them.
Strategy: 
1. Find any function that calls BRANDING_TRANSLATIONS_EN, normalizeArabic, dynamicTranslationsCache, translateLocalSmart
   but those are no longer defined in the file.
2. Replace those broken functions with a simple proxy to the imported translateBrandingText.
3. Add the import if missing.
"""
import os
import re

PAGES_DIR = r"d:\sery17-main\sery17-main\frontend\src\pages"
IMPORT_LINE = "import { translateBrandingText } from '../utils/brandingTranslation';\n"

# Patterns indicating broken local code referencing undefined vars
BROKEN_REFS = ['BRANDING_TRANSLATIONS_EN', 'normalizeArabic', 'dynamicTranslationsCache', 'translateLocalSmart']

# Pattern: any const function that references any of the broken refs
BROKEN_FUNC_PATTERN = re.compile(
    r'const\s+(translate\w*|normAr)\s*=\s*\([^)]*\)\s*=>\s*\{.*?\n\s*\}(?:\s*;)?',
    re.DOTALL
)

def has_broken_refs(func_body):
    return any(ref in func_body for ref in BROKEN_REFS)

def is_import_present(content):
    return "from '../utils/brandingTranslation'" in content

def add_import(content):
    # Add after last existing import line
    lines = content.split('\n')
    last_import = 0
    for i, line in enumerate(lines):
        if line.strip().startswith('import '):
            last_import = i
    lines.insert(last_import + 1, IMPORT_LINE.rstrip())
    return '\n'.join(lines)

fixed = []
for file in os.listdir(PAGES_DIR):
    if not file.endswith('.js'):
        continue
    filepath = os.path.join(PAGES_DIR, file)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Check if any broken reference exists
    has_broken = any(ref in content for ref in BROKEN_REFS)
    if not has_broken:
        continue

    # Remove broken functions that reference undefined vars
    def replace_broken_func(match):
        body = match.group(0)
        if has_broken_refs(body):
            # Extract function name
            name_match = re.search(r'const\s+(\w+)\s*=', body)
            name = name_match.group(1) if name_match else None
            if name and name not in ['BRANDING_TRANSLATIONS_EN']:
                # Replace with proxy
                params_match = re.search(r'const\s+\w+\s*=\s*\(([^)]*)\)', body)
                params = params_match.group(1).strip() if params_match else 'text, isRtl'
                param_list = [p.strip() for p in params.split(',') if p.strip()]
                if len(param_list) >= 2:
                    return f'const {name} = ({param_list[0]}, {param_list[1]}) => translateBrandingText({param_list[0]}, {param_list[1]});'
                elif len(param_list) == 1:
                    return f'const {name} = ({param_list[0]}) => translateBrandingText({param_list[0]}, false);'
                else:
                    return ''
        return body

    content = BROKEN_FUNC_PATTERN.sub(replace_broken_func, content)

    # Also remove any standalone const BRANDING_TRANSLATIONS_EN = {...}
    content = re.sub(r'const\s+BRANDING_TRANSLATIONS_EN\s*=\s*\{[^;]+\}\s*;', '', content, flags=re.DOTALL)

    # Check if import needed
    has_broken_still = any(ref in content for ref in BROKEN_REFS)
    needs_import = 'translateBrandingText' in content and not is_import_present(content)

    if needs_import:
        content = add_import(content)

    # Clean excessive blank lines
    content = re.sub(r'\n{4,}', '\n\n', content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        fixed.append(file)
        print(f"Fixed: {file}")

print(f"\nDone. Fixed {len(fixed)} files: {fixed}")

# Final check
print("\n--- Final verification ---")
for file in os.listdir(PAGES_DIR):
    if not file.endswith('.js'):
        continue
    filepath = os.path.join(PAGES_DIR, file)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    problems = [ref for ref in BROKEN_REFS if ref in content and f'const {ref}' not in content]
    if problems:
        print(f"  WARNING {file}: uses undefined {problems}")
