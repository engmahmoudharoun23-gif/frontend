import motor.motor_asyncio
import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv

async def clean():
    env_path = Path('backend/.env')
    load_dotenv(env_path)
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'wfm_reports')
    
    client = motor.motor_asyncio.AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # 1. Set Medhat to Level 2
    res_medhat = await db.users.update_many(
        {"full_name": {"$regex": "مدحت", "$options": "i"}},
        {"$set": {"level": "2"}}
    )
    print(f"Medhat accounts set to L2: {res_medhat.modified_count}")
    
    # 2. Set the main Mahmoud to Level 3
    res_mahmoud = await db.users.update_one(
        {"username": "Eng Mahmoud"},
        {"$set": {"level": "3"}}
    )
    print(f"Main Mahmoud (Eng Mahmoud) set to L3: {res_mahmoud.modified_count}")
    
    # 3. Deactivate or lower other Mahmouds
    res_others = await db.users.update_many(
        {
            "username": {"$ne": "Eng Mahmoud"},
            "full_name": {"$regex": "محمود", "$options": "i"}
        },
        {"$set": {"is_active": False}}
    )
    print(f"Other Mahmoud accounts deactivated: {res_others.modified_count}")
    
    await client.close()

if __name__ == "__main__":
    asyncio.run(clean())
