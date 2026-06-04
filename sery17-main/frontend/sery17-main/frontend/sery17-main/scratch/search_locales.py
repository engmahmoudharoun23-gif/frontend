import os

root_dir = 'frontend/src'
for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith('.json'):
            print(f"Found JSON file: {os.path.join(root, file)}")
