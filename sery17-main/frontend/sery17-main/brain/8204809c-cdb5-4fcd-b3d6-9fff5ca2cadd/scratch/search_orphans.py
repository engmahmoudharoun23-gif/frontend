
import motor.motor_asyncio
import asyncio

async def search_orphans():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    # Search for reports with no project or unknown project
    reports = await db.reports.find({"project": {"$exists": False}}).to_list(100)
    print(f"Reports with NO project field: {len(reports)}")
    
    reports_empty = await db.reports.find({"project": ""}).to_list(100)
    print(f"Reports with EMPTY project field: {len(reports_empty)}")

asyncio.run(search_orphans())
