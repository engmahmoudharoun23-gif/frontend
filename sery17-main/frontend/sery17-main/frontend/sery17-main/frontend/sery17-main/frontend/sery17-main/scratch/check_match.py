import asyncio
import sys
import json
from motor.motor_asyncio import AsyncIOMotorClient

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def normalize(text):
    if not text: return ""
    import re
    text = text.strip()
    text = re.sub(r'\s+', ' ', text)
    text = text.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا')
    text = text.replace('ة', 'ه').replace('ى', 'ي')
    return text

async def check_match():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    projects = await db.projects.find().to_list(100)
    project_names = [p['name'] for p in projects]
    
    user = await db.users.find_one({"username": " Mahmoud"}) # Leading space!
    if not user:
        user = await db.users.find_one({"username": "Mahmoud"})
    
    if user:
        pp = user.get('project_permissions', {})
        print(f"Checking for user: '{user.get('username')}'")
        for p_name in project_names:
            norm_p = normalize(p_name)
            match = False
            for k in pp.keys():
                if normalize(k) == norm_p:
                    match = True
                    print(f"MATCH: Project '{p_name}' matches Permission Key '{k}'")
                    print(f"Perms: {pp[k]}")
            if not match:
                print(f"NO MATCH for Project: '{p_name}'")
    else:
        print("User Mahmoud not found")
    client.close()

if __name__ == "__main__":
    asyncio.run(check_match())
