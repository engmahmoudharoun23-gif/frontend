import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def check_deleted_govs():
    load_dotenv('backend/.env')
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "wfm_reports")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    govs = await db.deleted_governorates.find().to_list(100)
    print(f"Deleted Governorates found: {len(govs)}")
    for g in govs:
        print(f" - {g.get('name')} (Project: {g.get('project')})")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_deleted_govs())
