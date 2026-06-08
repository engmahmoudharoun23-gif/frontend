import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.wfm_reports
    doc = await db.reports.find_one({'is_deleted': True})
    print("Deleted Report:", doc)
    
    all_reports = await db.reports.count_documents({})
    print("Total Reports:", all_reports)
    
    deleted_reports = await db.reports.count_documents({'is_deleted': True})
    print("Deleted Reports Count:", deleted_reports)

if __name__ == "__main__":
    asyncio.run(check())
