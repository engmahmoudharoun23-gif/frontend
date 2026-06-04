import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def list_users_with_creator():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    users = await db.users.find({}, {"_id": 0, "username": 1, "created_by": 1}).to_list(100)
    for u in users:
        print(f"User: {u.get('username')}, Created By: {u.get('created_by')}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(list_users_with_creator())
