import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

async def check_dbs():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    dbs = await client.list_database_names()
    print("Databases:", dbs)
    
    for db_name in dbs:
        db = client[db_name]
        cols = await db.list_collection_names()
        print(f"--- DB: {db_name} ---")
        for c in cols:
            count = await db[c].count_documents({})
            print(f"Collection: {c}, count: {count}")

    client.close()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(check_dbs())
