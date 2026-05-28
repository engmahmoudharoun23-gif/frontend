import os
import time

def find_recent_files(root_dir):
    current_time = time.time()
    one_day_ago = current_time - 24 * 3600
    
    print("--- RECENTLY MODIFIED FILES (last 24 hours) ---")
    for root, dirs, files in os.walk(root_dir):
        if any(ignored in root for ignored in ['.git', 'node_modules', 'venv', '.emergent', '.screenshots']):
            continue
        for file in files:
            file_path = os.path.join(root, file)
            try:
                mtime = os.path.getmtime(file_path)
                if mtime >= one_day_ago:
                    mod_time_str = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(mtime))
                    rel_path = os.path.relpath(file_path, root_dir)
                    print(f"{rel_path} - Modified: {mod_time_str}")
            except Exception as e:
                pass

if __name__ == "__main__":
    find_recent_files("d:\\sery17-main\\sery17-main")
