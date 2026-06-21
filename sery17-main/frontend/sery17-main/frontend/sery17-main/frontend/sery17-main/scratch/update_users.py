with open('frontend/src/pages/Users.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = "'safety_reports', 'quality_reports',"
if target not in content:
    # let's try with different quotes or spacing
    target = "'safety_reports', 'quality_reports'"

if target not in content:
    raise Exception("Could not find quality_reports in Users.js")

replacement = target.replace("'quality_reports'", "'quality_reports', 'business_reports'")
content = content.replace(target, replacement)

with open('frontend/src/pages/Users.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("frontend/src/pages/Users.js updated successfully!")
