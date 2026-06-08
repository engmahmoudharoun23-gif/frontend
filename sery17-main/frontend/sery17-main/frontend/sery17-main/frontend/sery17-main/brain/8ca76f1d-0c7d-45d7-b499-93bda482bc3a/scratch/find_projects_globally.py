import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def find_projects():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    dbs = await client.list_database_names()
    
    target_names = ["الرياض", "الدمام", "القصيم", "مكة", "المدينة"]
    
    for db_name in dbs:
        if db_name in ['admin', 'config', 'local']: continue
        db = client[db_name]
        colls = await db.list_collection_names()
        for coll_name in colls:
            docs = await db[coll_name].find().to_list(1000)
            for d in docs:
                s = str(d)
                for name in target_names:
                    if name in s:
                        print(f"Found '{name}' in DB: {db_name}, Collection: {coll_name}, ID: {d.get('id') or d.get('_id')}")
                        break
    client.close()

if __name__ == "__main__":
    asyncio.run(find_projects())
