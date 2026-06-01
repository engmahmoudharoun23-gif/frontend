import os

for root, dirs, files in os.walk('frontend'):
    for file in files:
        if file.endswith('.json') and ('ar' in root or 'en' in root or 'locale' in root):
            print(f"Translation file: {os.path.join(root, file)}")
