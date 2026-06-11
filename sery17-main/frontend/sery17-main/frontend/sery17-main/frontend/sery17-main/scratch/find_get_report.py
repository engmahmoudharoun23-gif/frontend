import sys

file_path = 'backend/server.py'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(len(lines)):
    if 'def get_report(' in lines[i]:
        start = max(0, i - 2)
        end = min(len(lines), i + 35)
        print(f"--- Match around line {i+1} ---")
        for j in range(start, end):
            print(f"{j+1}: {lines[j].rstrip()}")
        break
