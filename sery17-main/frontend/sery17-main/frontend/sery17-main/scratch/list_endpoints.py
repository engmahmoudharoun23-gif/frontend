import re

path = r"d:\sery17-main\sery17-main\backend\server.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

endpoints = re.findall(r'@app\.(get|post|put|delete)\("(.*?)"\)', content)
for method, url in endpoints:
    if "dashboard" in url or "reports" in url or "project" in url:
        print(f"{method.upper()} {url}")
