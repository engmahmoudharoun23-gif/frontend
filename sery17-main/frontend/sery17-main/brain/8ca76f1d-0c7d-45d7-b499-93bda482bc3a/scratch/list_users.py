import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def list_all_users():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    users = await db.users.find({}, {"_id": 0, "username": 1, "role": 1, "id": 1}).to_list(100)
    for u in users:
        print(f"Username: {u.get('username')}, Role: {u.get('role')}, ID: {u.get('id')}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(list_all_users())
