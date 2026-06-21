import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_users():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    users = await db.users.find({}).to_list(100)
    for u in users:
        print(f"User: {u.get('username')}, Role: {u.get('role')}, Govs: {u.get('governorates')}, Projects: {u.get('projects')}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_users())
