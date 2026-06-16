import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    count = await db.users.count_documents({})
    print(f'Users count: {count}')
    
    admin = await db.users.find_one({"username": "admin"})
    if admin:
        print("Admin user exists")
    else:
        print("Admin user does NOT exist")
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
