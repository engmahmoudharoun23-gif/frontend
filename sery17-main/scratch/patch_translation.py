import os

with open('backend/server.py', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('"الحالة": "Status",', '"الحالة": "Status", "خط العرض": "Latitude", "خط الطول": "Longitude",')

with open('backend/server.py', 'w', encoding='utf-8') as f:
    f.write(text)
print("Done")
