import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def find_mustafa():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    users = await db.users.find().to_list(100)
    print("ALL USERS:")
    for u in users:
        print(f"Username: '{u.get('username')}', Full Name: '{u.get('full_name')}'")
    client.close()

if __name__ == "__main__":
    asyncio.run(find_mustafa())
