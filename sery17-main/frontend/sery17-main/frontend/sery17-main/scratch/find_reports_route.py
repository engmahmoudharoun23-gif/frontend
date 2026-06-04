import re

def find_routes():
    lines = open(r'd:\sery17-main\sery17-main\backend\server.py', encoding='utf-8').readlines()
    for i, l in enumerate(lines):
        if ('@api_router.get' in l and '/reports' in l) or ('@api_router.get' in l and '/projects' in l):
            print(f'{i}: {l.strip()}')

find_routes()
