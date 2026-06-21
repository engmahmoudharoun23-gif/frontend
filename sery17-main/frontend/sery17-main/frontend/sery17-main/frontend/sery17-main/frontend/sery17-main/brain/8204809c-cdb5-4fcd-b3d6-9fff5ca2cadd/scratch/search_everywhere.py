
import motor.motor_asyncio
import asyncio

async def search_everywhere():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    dbs = await client.list_database_names()
    
    for db_name in dbs:
        if db_name in ["admin", "config", "local"]: continue
        db = client[db_name]
        colls = await db.list_collection_names()
        for c in colls:
            try:
                count = await db[c].count_documents({"governorate": {"$regex": "عفيف", "$options": "i"}})
                if count > 0:
                    print(f"DB: {db_name}, Coll: {c}, Afif count: {count}")
                
                # Also check 'area' field (common in connections)
                count_area = await db[c].count_documents({"area": {"$regex": "عفيف", "$options": "i"}})
                if count_area > 0:
                    print(f"DB: {db_name}, Coll: {c} (AREA), Afif count: {count_area}")
            except:
                pass

asyncio.run(search_everywhere())
