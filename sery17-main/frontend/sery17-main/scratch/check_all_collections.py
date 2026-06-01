import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_all():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    collections = await db.list_collection_names()
    for c in sorted(collections):
        count = await db[c].count_documents({})
        if count > 0:
            print(f'{c}: {count}')
    client.close()

if __name__ == "__main__":
    asyncio.run(check_all())
