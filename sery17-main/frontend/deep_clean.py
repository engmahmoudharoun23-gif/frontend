"""
Remove ALL local duplicate translation code from pages that import translateBrandingText
from the central brandingTranslation.js utility.
This covers the 6 pages still having the MyMemory fetch code.
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

PATTERNS = [
    # Remove the whole triggerAsyncTranslation function body (everything between the function braces)
    re.compile(
        r'const\s+triggerAsyncTranslation\s*=\s*\([^)]*\)\s*=>\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}\s*;',
        re.DOTALL
    ),
    # Remove dynamicTranslationsCache IIFE
    re.compile(r'const\s+dynamicTranslationsCache\s*=\s*\(\(\)\s*=>\s*\{.*?\}\)\(\)\s*;', re.DOTALL),
    # Remove saveDynamicCache
    re.compile(r'const\s+saveDynamicCache\s*=\s*\(\)\s*=>\s*\{.*?\}\s*;', re.DOTALL),
    # Remove BRANDING_TRANSLATIONS_EN object (large dict)
    re.compile(r'const\s+BRANDING_TRANSLATIONS_EN\s*=\s*\{[^;]+\}\s*;', re.DOTALL),
    # Remove localWordsMap
    re.compile(r'const\s+localWordsMap\s*=\s*\{[^;]+\}\s*;', re.DOTALL),
    # Remove normalizeArabic
    re.compile(r'const\s+normalizeArabic\s*=\s*\([^)]*\)\s*=>\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}\s*;', re.DOTALL),
    # Remove translateLocalSmart
    re.compile(r'const\s+translateLocalSmart\s*=\s*\([^)]*\)\s*=>\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}\s*;', re.DOTALL),
    # Remove translateBrandingText (non-exported local version)
    re.compile(r'(?<!export\s)const\s+translateBrandingText\s*=\s*\([^)]*\)\s*=>\s*\{.*?\}\s*;', re.DOTALL),
    # Remove pendingTranslations set
    re.compile(r'const\s+pendingTranslations\s*=\s*new\s+Set\(\)\s*;'),
    # Remove normAr local
    re.compile(r'const\s+normAr\s*=\s*\([^)]*\)\s*=>[^;]+;'),
]

for filepath in PAGES:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    for pattern in PATTERNS:
        content = pattern.sub('', content)
    
    # Clean up excessive blank lines
    content = re.sub(r'\n{4,}', '\n\n', content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Cleaned: {os.path.basename(filepath)}")
    else:
        print(f"No changes: {os.path.basename(filepath)}")

print("\nDone.")
