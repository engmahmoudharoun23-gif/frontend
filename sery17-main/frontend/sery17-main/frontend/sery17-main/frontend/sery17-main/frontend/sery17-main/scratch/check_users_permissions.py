import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json

async def test():
    from dotenv import load_dotenv
    load_dotenv('backend/.env')
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'wfm_reports')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    users = await db.users.find({}).to_list(100)
    for u in users:
        print(f"User: {u.get('username')} - can_create: {u.get('can_create_subusers')} - Govs: {u.get('governorates')}")
        print(f"Perms: {u.get('permissions')}")
        print("-" * 40)

if __name__ == '__main__':
    asyncio.run(test())
