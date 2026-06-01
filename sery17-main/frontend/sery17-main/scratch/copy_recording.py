import os
import shutil

src = r"C:\Users\L\.gemini\antigravity\brain\13876e2c-7206-4c2a-aeed-e49d728bdd94\business_reports_flow_1779227994751.webp"
dest_dir = r"d:\sery17-main\sery17-main\artifacts"
os.makedirs(dest_dir, exist_ok=True)
dest = os.path.join(dest_dir, "business_reports_flow.webp")

if os.path.exists(src):
    shutil.copy(src, dest)
    print(f"COPY_SUCCESS: {dest}")
else:
    # Try searching in the whole brain directory
    found = False
    brain_dir = r"C:\Users\L\.gemini\antigravity\brain\13876e2c-7206-4c2a-aeed-e49d728bdd94"
    if os.path.exists(brain_dir):
        for root, dirs, files in os.walk(brain_dir):
            for file in files:
                if 'business_reports_flow' in file and file.endswith('.webp'):
                    shutil.copy(os.path.join(root, file), dest)
                    print(f"COPY_SUCCESS from search: {dest}")
                    found = True
                    break
            if found:
                break
    if not found:
        print("SOURCE WEBP NOT FOUND")
