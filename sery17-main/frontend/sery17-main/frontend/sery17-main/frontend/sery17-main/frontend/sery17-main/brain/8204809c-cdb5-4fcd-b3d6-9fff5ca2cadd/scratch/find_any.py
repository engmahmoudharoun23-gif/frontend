
import motor.motor_asyncio
import asyncio

async def find_any_report():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    dbs = await client.list_database_names()
    for db_name in dbs:
        db = client[db_name]
        colls = await db.list_collection_names()
        for c in colls:
            try:
                count = await db[c].count_documents({"report_number": {"$exists": True}})
                if count > 0:
                    print(f"DB: {db_name}, Coll: {c}, Count: {count}")
            except:
                pass

asyncio.run(find_any_report())
