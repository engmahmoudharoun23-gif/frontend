import json

with open('frontend/package.json', 'r', encoding='utf-8') as f:
    pkg = json.load(f)

print("SCRIPTS:")
print(json.dumps(pkg.get("scripts", {}), indent=2))
