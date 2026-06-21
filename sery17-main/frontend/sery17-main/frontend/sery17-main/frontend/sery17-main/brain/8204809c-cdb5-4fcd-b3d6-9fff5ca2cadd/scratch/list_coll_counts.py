
import motor.motor_asyncio
import asyncio

async def list_coll_counts():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    colls = await db.list_collection_names()
    for c in colls:
        count = await db[c].count_documents({})
        print(f"Collection: {c}, Count: {count}")

asyncio.run(list_coll_counts())
