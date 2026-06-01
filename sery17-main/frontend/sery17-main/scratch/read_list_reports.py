import sys
sys.stdout.reconfigure(encoding='utf-8')
with open(r'd:\sery17-main\sery17-main\backend\server.py', encoding='utf-8') as f:
    lines = f.readlines()
    for i, l in enumerate(lines):
        if '@api_router.get("/reports"' in l and 'response_model' not in l:
            pass # we want the line with @api_router.get("/reports")
        if '@api_router.get("/reports"' in l:
            print("".join(lines[i:i+80]))
            break
