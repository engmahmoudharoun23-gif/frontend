import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def list_collections():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    cols = await db.list_collection_names()
    print("Collections:", cols)
    
    for col in cols:
        count = await db[col].count_documents({})
        print(f"Collection: {col}, Count: {count}")

if __name__ == "__main__":
    asyncio.run(list_collections())
