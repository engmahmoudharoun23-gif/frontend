
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

async def check_user():
    env_path = Path("d:/sery17-main/sery17-main/backend/.env")
    load_dotenv(dotenv_path=env_path)
    
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    
    print(f"Connecting to {mongo_url}, DB: {db_name}")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    user = await db.users.find_one({"username": {"$regex": "Mohamed Shawqi", "$options": "i"}})
    if user:
        print(f"User found: {user.get('full_name')}")
        print(f"Role: {user.get('role')}")
        print(f"Projects: {user.get('projects')}")
        print(f"Governorates: {user.get('governorates')}")
    else:
        print("User not found")

if __name__ == "__main__":
    asyncio.run(check_user())
