import os

for root, dirs, files in os.walk('.'):
    for file in files:
        if 'business_report_modal' in file:
            print(f"FOUND SCREENSHOT: {os.path.abspath(os.path.join(root, file))}")
