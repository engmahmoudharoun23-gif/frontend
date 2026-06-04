with open('backend/server.py', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        if '"is_deleted": False' in line or "'is_deleted': False" in line:
            print(f"{i}: {line.strip()}")
