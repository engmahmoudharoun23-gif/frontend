
import motor.motor_asyncio
import asyncio

async def list_gov_counts():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    govs = await db.reports.distinct("governorate")
    for g in govs:
        count = await db.reports.count_documents({"governorate": g, "is_deleted": {"$ne": True}})
        print(f"Gov: '{g}', Active Reports: {count}")

asyncio.run(list_gov_counts())
