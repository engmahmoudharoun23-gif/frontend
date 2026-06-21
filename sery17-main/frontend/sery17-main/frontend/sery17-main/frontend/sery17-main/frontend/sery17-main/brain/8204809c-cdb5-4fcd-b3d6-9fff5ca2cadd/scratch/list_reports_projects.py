
import motor.motor_asyncio
import asyncio

async def list_reports_projects():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    reports = await db.reports.find({}, {"report_number": 1, "project": 1, "governorate": 1}).to_list(100)
    for r in reports:
        print(f"Report {r.get('report_number')}: Project='{r.get('project')}', Gov='{r.get('governorate')}'")

asyncio.run(list_reports_projects())
