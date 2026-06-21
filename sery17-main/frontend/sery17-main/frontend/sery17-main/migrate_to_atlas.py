import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

LOCAL_URI = "mongodb://localhost:27017"
ATLAS_URI = "mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0"
DB_NAME = "wfm_reports"

async def migrate():
    print("Connecting to Local and Atlas databases...")
    local_client = AsyncIOMotorClient(LOCAL_URI)
    atlas_client = AsyncIOMotorClient(ATLAS_URI)
    
    local_db = local_client[DB_NAME]
    atlas_db = atlas_client[DB_NAME]
    
    collections = await local_db.list_collection_names()
    print(f"Found {len(collections)} collections locally: {collections}")
    
    for coll_name in collections:
        print(f"\nProcessing collection: {coll_name}")
        
        # Count local
        local_count = await local_db[coll_name].count_documents({})
        print(f"   - Local documents: {local_count}")
        
        if local_count == 0:
            print("   - Skipping empty collection.")
            continue
            
        # Drop atlas collection to ensure exact replica
        await atlas_db[coll_name].drop()
        print(f"   - Cleared Atlas collection {coll_name}.")
        
        # Fetch all documents
        docs = await local_db[coll_name].find({}).to_list(None)
        
        # Insert into atlas
        if docs:
            await atlas_db[coll_name].insert_many(docs)
            print(f"   Migrated {len(docs)} documents to Atlas.")
            
    print("\nMigration completed successfully!")
    local_client.close()
    atlas_client.close()

if __name__ == "__main__":
    asyncio.run(migrate())
