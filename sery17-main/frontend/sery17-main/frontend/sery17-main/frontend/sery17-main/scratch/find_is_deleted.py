import sys
sys.stdout.reconfigure(encoding='utf-8')
with open(r'd:\sery17-main\sery17-main\backend\server.py', encoding='utf-8') as f:
    lines = f.readlines()
    for i, l in enumerate(lines):
        if '"is_deleted": {"$ne": True}' in l or "'is_deleted': {'$ne': True}" in l:
            # check 10 lines before to see context
            print("---")
            print("".join(lines[max(0, i-5):i+2]))
