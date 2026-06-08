
import motor.motor_asyncio
import asyncio

async def check_recent_report():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    report = await db.reports.find_one(sort=[("created_at", -1)])
    if report:
        print(f"Most recent report: {report.get('report_number')} at {report.get('created_at')}")
    else:
        print("No reports found")

asyncio.run(check_recent_report())
