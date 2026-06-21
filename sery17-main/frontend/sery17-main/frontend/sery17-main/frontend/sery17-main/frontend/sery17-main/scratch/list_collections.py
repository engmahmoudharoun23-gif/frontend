import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    collections = await db.list_collection_names()
    for col in collections:
        count = await db[col].count_documents({})
        print(f"Collection {col}: {count} documents")

asyncio.run(main())
