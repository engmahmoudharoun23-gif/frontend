
import motor.motor_asyncio
import asyncio

async def count_all():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    total = await db.reports.count_documents({})
    print(f"Total reports: {total}")
    
    active = await db.reports.count_documents({"is_deleted": {"$ne": True}})
    print(f"Active reports: {active}")

asyncio.run(count_all())
