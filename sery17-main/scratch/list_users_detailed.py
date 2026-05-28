import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
from bson import json_util
from dotenv import load_dotenv

load_dotenv('backend/.env')
mongo_url = os.environ.get('MONGO_URL')

async def check():
    client = AsyncIOMotorClient(mongo_url)
    db = client.wfm_reports
    users = await db.users.find({}, {'username': 1, 'full_name': 1, 'projects': 1, 'governorates': 1, '_id': 0}).to_list(100)
    with open('users_atlas_dump.json', 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2, default=json_util.default)

asyncio.run(check())
