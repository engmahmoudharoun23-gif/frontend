import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv
from pathlib import Path

# Load env variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / 'backend' / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def reset_admin():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    hashed = pwd_context.hash("admin123")
    res = await db.users.update_one(
        {"username": "admin"},
        {"$set": {"hashed_password": hashed}}
    )
    print(f"Success! Hashed admin password. Updated count: {res.modified_count}")
    client.close()

if __name__ == "__main__":
    asyncio.run(reset_admin())
