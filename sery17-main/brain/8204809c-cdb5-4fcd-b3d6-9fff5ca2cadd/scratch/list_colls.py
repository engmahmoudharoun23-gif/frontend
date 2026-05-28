
import motor.motor_asyncio
import asyncio

async def list_colls():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    colls = await db.list_collection_names()
    print("Collections in 'wfm_reports':")
    for c in colls:
        print(f" - {c}")

asyncio.run(list_colls())
