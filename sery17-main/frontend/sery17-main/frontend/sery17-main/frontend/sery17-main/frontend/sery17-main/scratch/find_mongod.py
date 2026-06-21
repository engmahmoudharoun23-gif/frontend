import os

def find_mongod():
    search_dirs = [
        r'C:\Program Files\MongoDB',
        r'C:\Program Files (x86)\MongoDB',
        r'C:\mongodb'
    ]
    for search_dir in search_dirs:
        if os.path.exists(search_dir):
            for root, dirs, files in os.walk(search_dir):
                if 'mongod.exe' in files:
                    return os.path.join(root, 'mongod.exe')
    return None

path = find_mongod()
if path:
    print(f"FOUND_MONGOD: {path}")
else:
    print("MONGOD NOT FOUND IN STANDARD PATHS")
