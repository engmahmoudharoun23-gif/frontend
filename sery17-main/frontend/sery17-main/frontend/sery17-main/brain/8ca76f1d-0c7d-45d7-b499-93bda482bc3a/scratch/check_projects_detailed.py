import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def check_projects():
    load_dotenv('backend/.env')
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "wfm_reports")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"Collections: {await db.list_collection_names()}")
    
    projects = await db.projects.find().to_list(100)
    print(f"Projects found: {len(projects)}")
    for p in projects:
        print(f" - {p}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_projects())
