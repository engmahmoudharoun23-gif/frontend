import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path

async def check():
    # Load .env from backend folder
    ROOT_DIR = Path(__file__).parent.parent
    env_path = ROOT_DIR / 'backend' / '.env'
    load_dotenv(env_path)
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'wfm_reports')
    
    client = motor.motor_asyncio.AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Search for Medhat and Mahmoud
    users = await db.users.find({
        "full_name": {"$regex": "مدحت|محمود", "$options": "i"}
    }, {
        "full_name": 1, 
        "level": 1, 
        "username": 1,
        "role": 1,
        "projects": 1
    }).to_list(100)
    
    print(f"--- Users found: {len(users)} ---")
    for u in users:
        print(f"Name: {u.get('full_name')}, Username: {u.get('username')}, Level: {u.get('level')}, Role: {u.get('role')}")
        print(f"Projects: {u.get('projects')}")
        print("-" * 30)
    
    await client.close()

if __name__ == "__main__":
    asyncio.run(check())
