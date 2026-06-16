import sys
with open('backend/server.py', 'r', encoding='utf-8') as f:
    text = f.read()

import re
print("Message Classes:")
print("\n".join(re.findall(r'class \w*Message\w*\(.*?\):[\s\S]*?(?=class|\Z)', text)[:2]))

print("Notification Endpoints:")
print("\n".join(re.findall(r'@app\.[a-z]+\(".*?/notifications/.*?"\)[\s\S]*?(?=def )', text)))
