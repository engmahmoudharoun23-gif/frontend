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
    
    print(f"Collections in {db_name}: {await db.list_collection_names()}")
    
    for coll_name in await db.list_collection_names():
        count = await db[coll_name].count_documents({})
        print(f"\nCollection: {coll_name} ({count} docs)")
        docs = await db[coll_name].find().limit(5).to_list(5)
        for d in docs:
            # Print important fields if they exist
            info = {k: v for k, v in d.items() if k in ['name', 'username', 'full_name', 'label', 'project']}
            print(f" - {info}")
            
    client.close()

if __name__ == "__main__":
    asyncio.run(check_db())
