import sys
import os

files_to_check = [
    'd:/sery17-main/sery17-main/frontend/src/pages/Violations.js',
    'd:/sery17-main/sery17-main/frontend/src/components/ViolationsModal.js',
    'd:/sery17-main/sery17-main/frontend/src/pages/QualityReports.js'
]

for fp in files_to_check:
    if os.path.exists(fp):
        with open(fp, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for compressImage logic
        if 'compressImage =' in content or 'compressImage(' in content:
            print(f"{fp}: HAS compressImage")
        else:
            print(f"{fp}: NO compressImage")
        
        # Check for multiple in file inputs
        if 'type="file"' in content:
            parts = content.split('type="file"')
            for i, p in enumerate(parts[1:]):
                if 'multiple' in p[:200]:
                    print(f"  {fp} Input {i}: HAS multiple")
                else:
                    print(f"  {fp} Input {i}: NO multiple")
