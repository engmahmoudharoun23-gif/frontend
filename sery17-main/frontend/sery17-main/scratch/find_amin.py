import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient("mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0")
    db = client["wfm_reports"]
    user = await db.users.find_one({"name": {"$regex": "أمين مختار"}})
    print("User found:", user)

asyncio.run(main())
