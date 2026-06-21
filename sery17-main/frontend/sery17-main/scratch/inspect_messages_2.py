import sys
import re

with open('backend/server.py', 'r', encoding='utf-8') as f:
    text = f.read()

print("==== Message Class ====")
m = re.search(r'class Message\(BaseModel\):[\s\S]*?(?=class |\Z)', text)
if m: print(m.group(0))

print("==== Endpoints with message/notification ====")
for endpoint in re.findall(r'@app\.[a-z]+\(.*?(?:message|notification|note).*?\)[\s\S]*?def .*?\(.*?\):', text):
    print(endpoint.split('\n')[0])
