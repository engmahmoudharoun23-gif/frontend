import os
import re

file_path = r"d:\sery17-main\sery17-main\backend\server.py"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Mahmoud's Title to "م/ محمود هارون"
old_title = "المهندس محمود هارون"
new_title = "م/ محمود هارون"
content = content.replace(old_title, new_title)

# 2. Remove problematic DEBUG prints that might be showing mangled Arabic
# Specifically the ones I saw in the logs
content = re.sub(r"print\(f\"DEBUG: Project='\{project\}', Month='\{month\}', query_filter=\{query_filter\}\"\)", "# print debug", content)
content = re.sub(r"print\(f\"DEBUG: get_reports called\..*\"\)", "# print debug", content)

# Remove other common prints that might have mangled text
content = re.sub(r"print\(f\"(.*?): \{str\(e\)\}\"\)", r"# print error \1", content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Mahmoud's title and removed debug prints.")
