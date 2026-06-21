
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def check_subs():
    load_dotenv('backend/.env')
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    user = await db.users.find_one({"username": {"$regex": "Abdelmonem", "$options": "i"}})
    print(f"User ID: {user['id']}")
    
    subs = await db.users.find({"created_by": user['id']}).to_list(None)
    print(f"Subordinates count: {len(subs)}")
    for s in subs:
        print(f"  Sub: {s['username']} ({s['id']})")
    
    client.close()

asyncio.run(check_subs())
