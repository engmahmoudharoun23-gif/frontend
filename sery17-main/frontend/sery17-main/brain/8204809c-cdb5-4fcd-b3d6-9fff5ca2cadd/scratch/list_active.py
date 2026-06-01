
import motor.motor_asyncio
import asyncio

async def list_active_reports():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    reports = await db.reports.find({"is_deleted": {"$ne": True}}).to_list(100)
    print(f"Active reports count: {len(reports)}")
    for r in reports:
        print(f"Report: {r.get('report_number')} | Project: {r.get('project')} | Gov: {r.get('governorate')} | CreatedBy: {r.get('created_by')}")

asyncio.run(list_active_reports())
