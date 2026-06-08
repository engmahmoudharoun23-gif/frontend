import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_id_type():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    admin = await db.users.find_one({"username": "admin"})
    if admin:
        print(f"Admin ID: {admin.get('id')} (Type: {type(admin.get('id'))})")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_id_type())
