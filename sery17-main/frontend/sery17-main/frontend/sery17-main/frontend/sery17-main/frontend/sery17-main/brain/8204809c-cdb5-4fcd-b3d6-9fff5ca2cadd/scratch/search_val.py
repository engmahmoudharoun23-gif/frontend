
import motor.motor_asyncio
import asyncio

async def search_val():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    dbs = await client.list_database_names()
    val = "953623623562"
    for db_name in dbs:
        db = client[db_name]
        colls = await db.list_collection_names()
        for c in colls:
            try:
                doc = await db[c].find_one({"$or": [{"report_number": val}, {"id": val}, {"_id": val}]})
                if doc:
                    print(f"FOUND in DB: {db_name}, Coll: {c}")
            except:
                pass

asyncio.run(search_val())
