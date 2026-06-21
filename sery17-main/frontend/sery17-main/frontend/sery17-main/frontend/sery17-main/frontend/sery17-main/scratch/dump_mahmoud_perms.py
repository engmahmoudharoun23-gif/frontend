import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
from dotenv import load_dotenv

load_dotenv('backend/.env')
mongo_url = os.environ.get('MONGO_URL')

async def check():
    client = AsyncIOMotorClient(mongo_url)
    db = client.wfm_reports
    u = await db.users.find_one({'username': 'Eng Mahmoud Haroun'}, {'_id': 0, 'projects': 1, 'project_permissions': 1})
    with open('mahmoud_perms.json', 'w', encoding='utf-8') as f:
        json.dump(u, f, ensure_ascii=False, indent=2)

asyncio.run(check())
