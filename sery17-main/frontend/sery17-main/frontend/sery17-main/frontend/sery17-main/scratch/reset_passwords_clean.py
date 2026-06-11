import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / 'backend' / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def reset_all_passwords():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'wfm_reports')]
    
    new_password = "123456"
    hashed_password = pwd_context.hash(new_password)
    
    print("Resetting passwords...")
    users = await db.users.find({}, {"id": 1, "username": 1}).to_list(100)
    
    updated_count = 0
    for user in users:
        result = await db.users.update_one(
            {"id": user['id']},
            {"$set": {"hashed_password": hashed_password}}
        )
        if result.modified_count > 0:
            updated_count += 1
            print(f"Updated: {user['username']}")
            
    print(f"Successfully updated {updated_count} users to password: {new_password}")
    client.close()

if __name__ == '__main__':
    asyncio.run(reset_all_passwords())
