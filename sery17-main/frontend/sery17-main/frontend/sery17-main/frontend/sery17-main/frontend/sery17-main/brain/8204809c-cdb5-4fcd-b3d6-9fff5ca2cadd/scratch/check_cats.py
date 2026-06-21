
import motor.motor_asyncio
import asyncio

async def check_categories():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    reports = await db.reports.find({}, {"report_number": 1, "category": 1}).to_list(100)
    for r in reports:
        print(f"Report {r.get('report_number')}: Category='{r.get('category')}'")

asyncio.run(check_categories())
