
import motor.motor_asyncio
import asyncio

async def list_projs():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    projs = await db.reports.distinct("project")
    for p in projs:
        count = await db.reports.count_documents({"project": p})
        active = await db.reports.count_documents({"project": p, "is_deleted": {"$ne": True}})
        print(f"Project: '{p}', Total: {count}, Active: {active}")

asyncio.run(list_projs())
