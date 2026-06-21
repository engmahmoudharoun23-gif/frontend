with open('backend/server.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Locate the get_business_reports function
func_start = content.find('async def get_business_reports(')
if func_start == -1:
    raise Exception("Could not find get_business_reports in server.py")

func_end = content.find('async def ', func_start + 100)
func_content = content[func_start:func_end]

# 1. Update non-admin governorate filter
target_nonadmin = """        # Apply governorate restriction
        if governorate:
            gov_query = get_flexible_in_query([governorate], "governorate")
            if gov_query:
                query.update(gov_query)"""

replacement_nonadmin = """        # Apply governorate restriction
        if governorate:
            gov_query = get_flexible_in_query([governorate], "governorate")
            if gov_query:
                query["$or"] = [
                    gov_query,
                    {"governorate": {"$in": ["جميع المحافظات", "الكل", "كل المحافظات"]}}
                ]"""

if target_nonadmin not in func_content:
    raise Exception("Could not find target_nonadmin block in get_business_reports")

# 2. Update admin governorate filter
target_admin = """        if governorate:
            gov_query = get_flexible_in_query([governorate], "governorate")
            if gov_query:
                query.update(gov_query)"""

replacement_admin = """        if governorate:
            gov_query = get_flexible_in_query([governorate], "governorate")
            if gov_query:
                query["$or"] = [
                    gov_query,
                    {"governorate": {"$in": ["جميع المحافظات", "الكل", "كل المحافظات"]}}
                ]"""

# Let's perform the replacement inside func_content
new_func_content = func_content.replace(target_nonadmin, replacement_nonadmin)
new_func_content = new_func_content.replace(target_admin, replacement_admin)

# Update full content
content = content[:func_start] + new_func_content + content[func_end:]

with open('backend/server.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("server.py updated successfully!")
