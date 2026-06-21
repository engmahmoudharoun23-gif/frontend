import re

with open('backend/server.py', 'r', encoding='utf-8') as f:
    src = f.read()

# Pattern to find the block to replace
pattern = r"""    if role != "admin":
        if role == "level3":
            query\["created_by"\] = user_doc\.get\("id"\)
        else:
            if not project and user_projs:
                
                query\.update\(get_loose_in_query\(user_projs, "project"\)\)
            elif project:
                
                query\.update\(get_flexible_in_query\(\[project\], "project"\)\)
            
            if not governorate and user_govs:
                
                query\.update\(get_flexible_in_query\(user_govs, "governorate"\)\)
            elif governorate:
                
                query\.update\(get_flexible_in_query\(\[governorate\], "governorate"\)\)
    else:"""

replacement = """    if role != "admin":
        if not project and user_projs:
            query.update(get_loose_in_query(user_projs, "project"))
        elif project:
            query.update(get_flexible_in_query([project], "project"))
        
        if not governorate and user_govs:
            query.update(get_flexible_in_query(user_govs, "governorate"))
        elif governorate:
            query.update(get_flexible_in_query([governorate], "governorate"))
    else:"""

new_src = re.sub(pattern, replacement, src, flags=re.MULTILINE)

with open('backend/server.py', 'w', encoding='utf-8') as f:
    f.write(new_src)

print("Done")
