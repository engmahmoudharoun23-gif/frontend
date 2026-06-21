import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

async def check_user_perms():
    ROOT_DIR = Path('.')
    load_dotenv(ROOT_DIR / 'backend' / '.env')
    
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    user = await db.users.find_one({"username": "Mohamed Shawqi"})
    if user:
        print(f"User: {user.get('username')}")
        print(f"Role: {user.get('role')}")
        print(f"Permissions: {user.get('permissions')}")
        print(f"Project Permissions: {user.get('project_permissions')}")
    else:
        print("User not found")

if __name__ == "__main__":
    asyncio.run(check_user_perms())
