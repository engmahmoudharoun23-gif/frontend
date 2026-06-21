"""
This script:
1. Removes the local duplicate triggerAsyncTranslation (MyMemory API) function from all pages
2. Removes the local duplicate dynamicTranslationsCache from all pages
3. Removes duplicate BRANDING_TRANSLATIONS_EN from all pages
4. Removes local translateBrandingText definitions from pages that import from utils
5. Ensures all pages import translateBrandingText from '../utils/brandingTranslation'
"""
import os
import re

SRC = r"d:\sery17-main\sery17-main\frontend\src\pages"

# Pattern to match and remove the whole triggerAsyncTranslation function (with MyMemory)
MYMEMORY_FUNC_PATTERN = re.compile(
    r'const\s+triggerAsyncTranslation\s*=\s*\([^)]*\)\s*=>\s*\{.*?(?=\n\s*(?:const|function|export|//|\Z))',
    re.DOTALL
)

# Pattern to remove duplicate dynamicTranslationsCache
DYN_CACHE_PATTERN = re.compile(
    r'const\s+dynamicTranslationsCache\s*=\s*\(\(\)\s*=>\s*\{.*?\}\)\(\)\s*;',
    re.DOTALL
)

# Pattern to remove duplicate BRANDING_TRANSLATIONS_EN
BRANDING_DICT_PATTERN = re.compile(
    r'const\s+BRANDING_TRANSLATIONS_EN\s*=\s*\{.*?\}\s*;',
    re.DOTALL
)

# Pattern to remove local translateBrandingText export/const (only if file imports it from utils already)
LOCAL_TRANSLATE_FUNC_PATTERN = re.compile(
    r'(?:export\s+)?const\s+translateBrandingText\s*=\s*\([^)]*\)\s*=>\s*\{.*?\}\s*;',
    re.DOTALL
)

# Pattern to remove local saveDynamicCache
SAVE_CACHE_PATTERN = re.compile(
    r'const\s+saveDynamicCache\s*=\s*\(\)\s*=>\s*\{.*?\}\s*;',
    re.DOTALL
)

# Pattern to remove local localWordsMap
LOCAL_WORDS_MAP_PATTERN = re.compile(
    r'const\s+localWordsMap\s*=\s*\{.*?\}\s*;',
    re.DOTALL
)

# Pattern to remove local normalizeArabic
NORMALIZE_PATTERN = re.compile(
    r'const\s+normalizeArabic\s*=\s*\([^)]*\)\s*=>\s*\{.*?\}\s*;',
    re.DOTALL
)

# Pattern to remove local translateLocalSmart
TRANSLATE_LOCAL_SMART_PATTERN = re.compile(
    r'const\s+translateLocalSmart\s*=\s*\([^)]*\)\s*=>\s*\{.*?\}\s*;',
    re.DOTALL
)

IMPORT_PATTERN = re.compile(
    r"import\s+\{[^}]*translateBrandingText[^}]*\}\s+from\s+'[^']*brandingTranslation'"
)

files_changed = []

for file in os.listdir(SRC):
    if not file.endswith('.js'):
        continue
    filepath = os.path.join(SRC, file)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Only process files that already import translateBrandingText from utils
    if not IMPORT_PATTERN.search(content):
        continue

    original = content

    # Remove local definitions that are now handled by the central utility
    content = MYMEMORY_FUNC_PATTERN.sub('', content)
    content = DYN_CACHE_PATTERN.sub('', content)
    content = SAVE_CACHE_PATTERN.sub('', content)
    content = BRANDING_DICT_PATTERN.sub('', content)
    content = LOCAL_WORDS_MAP_PATTERN.sub('', content)
    content = NORMALIZE_PATTERN.sub('', content)
    content = TRANSLATE_LOCAL_SMART_PATTERN.sub('', content)
    # Remove pendingTranslations set
    content = re.sub(r'const\s+pendingTranslations\s*=\s*new\s+Set\(\)\s*;', '', content)
    # Also remove local translateBrandingText if present (non-export version in pages)
    content = LOCAL_TRANSLATE_FUNC_PATTERN.sub('', content)

    # Clean up excessive blank lines
    content = re.sub(r'\n{4,}', '\n\n', content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        files_changed.append(file)
        print(f"Cleaned: {file}")

print(f"\nDone. {len(files_changed)} files cleaned.")
