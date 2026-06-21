import sys
sys.stdout.reconfigure(encoding='utf-8')
with open(r'd:\sery17-main\sery17-main\backend\server.py', encoding='utf-8') as f:
    lines = f.readlines()
    for i, l in enumerate(lines):
        if '@api_router.post("/reports", response_model=ReportResponse)' in l:
            print("".join(lines[i:i+150]))
            break
