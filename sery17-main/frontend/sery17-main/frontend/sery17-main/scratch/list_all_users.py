
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def list_users():
    load_dotenv('backend/.env')
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    users = await db.users.find({}).to_list(None)
    for u in users:
        print(f"Username: {u['username']} | Full Name: {u['full_name']} | Role: {u.get('role')}")
    
    client.close()

asyncio.run(list_users())
