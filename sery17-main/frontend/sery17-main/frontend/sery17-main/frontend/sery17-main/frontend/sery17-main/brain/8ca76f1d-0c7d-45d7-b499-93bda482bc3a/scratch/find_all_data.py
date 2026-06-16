import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def find_everything():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    dbs = await client.list_database_names()
    print(f"Databases: {dbs}")
    
    for db_name in dbs:
        if db_name in ['admin', 'config', 'local']: continue
        db = client[db_name]
        print(f"\n--- Database: {db_name} ---")
        colls = await db.list_collection_names()
        for coll in colls:
            count = await db[coll].count_documents({})
            print(f"Collection: {coll} ({count} docs)")
            if count > 0:
                docs = await db[coll].find().to_list(10)
                for d in docs:
                    # Print full doc but truncated if too long
                    s = str(d)
                    if len(s) > 200: s = s[:200] + "..."
                    print(f"  {s}")
                    
    client.close()

if __name__ == "__main__":
    asyncio.run(find_everything())
