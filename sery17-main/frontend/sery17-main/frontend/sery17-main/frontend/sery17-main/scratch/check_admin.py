import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    user = await db.users.find_one({"username": "admin"})
    print(f"Admin exists: {user is not None}")
    if user:
        print(f"Admin details: {user.get('full_name')}, {user.get('role')}")
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
