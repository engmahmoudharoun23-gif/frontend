
import motor.motor_asyncio
import asyncio

async def search_colls_everywhere():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    dbs = await client.list_database_names()
    for db_name in dbs:
        db = client[db_name]
        colls = await db.list_collection_names()
        for c in colls:
            if "reports" in c or "connections" in c:
                count = await db[c].count_documents({})
                print(f"DB: {db_name}, Coll: {c}, Count: {count}")

asyncio.run(search_colls_everywhere())
