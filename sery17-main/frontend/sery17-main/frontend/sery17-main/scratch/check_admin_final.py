import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_admin():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    u = await db.users.find_one({"username": "admin"})
    print(f"Admin: {u}")
    client.close()

if __name__ == "__main__":
    asyncio.run(check_admin())
