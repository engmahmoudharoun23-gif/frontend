import sys
try:
    with open('backend/server.py', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        for i, line in enumerate(lines):
            if 'def delete_report' in line or '@api_router.delete' in line:
                print(f'{i+1}: {line.strip()}')
except Exception as e:
    print(e)
