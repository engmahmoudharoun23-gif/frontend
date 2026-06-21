import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def search_for_projects():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    target_names = ["الرياض", "الدمام", "القصيم", "مكة", "المدينة"]
    
    colls = await db.list_collection_names()
    for coll_name in colls:
        print(f"Searching in {coll_name}...")
        docs = await db[coll_name].find().to_list(10000)
        for d in docs:
            s = str(d)
            for name in target_names:
                if name in s:
                    print(f"FOUND '{name}' in collection '{coll_name}'")
                    print(f"  Doc: {s[:500]}")
                    break
    client.close()

if __name__ == "__main__":
    asyncio.run(search_for_projects())
