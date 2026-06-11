
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def check_user():
    load_dotenv()
    db = AsyncIOMotorClient(os.environ['MONGO_URL'])[os.environ['DB_NAME']]
    user = await db.users.find_one({"username": {"$regex": "Mohamed Shawqi", "$options": "i"}})
    print(f"User: {user}")

if __name__ == "__main__":
    asyncio.run(check_user())
