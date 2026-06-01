import os
import shutil

dest_dir = r"d:\sery17-main\sery17-main\artifacts"
os.makedirs(dest_dir, exist_ok=True)
dest = os.path.join(dest_dir, "business_report_modal.png")

brain_dir = r"C:\Users\L\.gemini\antigravity\brain\13876e2c-7206-4c2a-aeed-e49d728bdd94"
found = False
if os.path.exists(brain_dir):
    for root, dirs, files in os.walk(brain_dir):
        for file in files:
            if 'business_report_modal' in file or 'click_feedback' in file:
                # Let's copy the most recent screenshot
                shutil.copy(os.path.join(root, file), dest)
                print(f"COPY_SUCCESS: {file} copied to {dest}")
                found = True
                break
        if found:
            break
if not found:
    print("SCREENSHOT NOT FOUND")
