import re

path = r"d:\sery17-main\sery17-main\frontend\src\pages\NewDashboard.js"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "fetchProjectsData" in line:
        print(f"Line {i+1}: {line.strip()}")
