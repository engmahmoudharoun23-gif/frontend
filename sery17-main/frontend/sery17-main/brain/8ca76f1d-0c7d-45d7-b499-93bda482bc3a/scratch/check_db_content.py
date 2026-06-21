import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def check_db():
    load_dotenv('backend/.env')
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "wfm_reports")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"Databases: {await client.list_database_names()}")
    print(f"Collections in {db_name}: {await db.list_collection_names()}")
    
    projects = await db.projects.find().to_list(100)
    print("Projects:")
    for p in projects:
        print(f" - {p.get('name')}")
        
    users = await db.users.find().to_list(100)
    print("Users:")
    for u in users:
        print(f" - {u.get('username')}: {u.get('full_name')} (Projects: {u.get('projects')})")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_db())
