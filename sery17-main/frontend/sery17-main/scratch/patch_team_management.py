import sys

with open('d:/sery17-main/sery17-main/frontend/src/pages/TeamManagement.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import if missing
if "import { resolveImageUrl }" not in content:
    content = content.replace(
        "import Layout from '../components/Layout';",
        "import Layout from '../components/Layout';\nimport { resolveImageUrl } from '../utils/imageUrl';"
    )

content = content.replace("src={formData.profile_picture}", "src={resolveImageUrl(formData.profile_picture)}")
content = content.replace("src={member.profile_picture}", "src={resolveImageUrl(member.profile_picture)}")

with open('d:/sery17-main/sery17-main/frontend/src/pages/TeamManagement.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("TeamManagement.js patched")
