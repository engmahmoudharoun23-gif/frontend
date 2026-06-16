
import motor.motor_asyncio
import asyncio

async def check_deleted():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    total = await db.reports.count_documents({})
    deleted = await db.reports.count_documents({"is_deleted": True})
    not_deleted = await db.reports.count_documents({"is_deleted": {"$ne": True}})
    print(f"Total: {total}, Deleted: {deleted}, Not Deleted: {not_deleted}")

asyncio.run(check_deleted())
