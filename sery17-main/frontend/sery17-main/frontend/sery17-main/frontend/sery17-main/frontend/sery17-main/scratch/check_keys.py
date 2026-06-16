import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.wfm_db
    doc = await db.reports.find_one({})
    if doc:
        print("Report Keys:", doc.keys())
    else:
        print("No reports found")

if __name__ == "__main__":
    asyncio.run(check())
