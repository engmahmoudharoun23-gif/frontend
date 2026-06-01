import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def find_all_docs_everywhere():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    dbs = await client.list_database_names()
    print(f"Databases: {dbs}")
    
    for db_name in dbs:
        if db_name in ['admin', 'config', 'local']: continue
        db = client[db_name]
        print(f"\n--- DB: {db_name} ---")
        colls = await db.list_collection_names()
        for c in colls:
            count = await db[c].count_documents({})
            print(f"  {c}: {count} docs")
            if count > 0:
                # Try to find Riyadh
                res = await db[c].find({"$text": {"$search": "الرياض"}}).to_list(1) if "text" in str(await db[c].index_information()) else []
                if not res:
                    # Manual search in first 100
                    docs = await db[c].find().to_list(100)
                    for d in docs:
                        if "الرياض" in str(d):
                            print(f"    !!! FOUND RIYADH IN {c} !!!")
                            break
    client.close()

if __name__ == "__main__":
    asyncio.run(find_all_docs_everywhere())
