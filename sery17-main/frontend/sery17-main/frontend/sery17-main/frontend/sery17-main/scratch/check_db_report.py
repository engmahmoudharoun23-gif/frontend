import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_db():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    report = await db.reports.find_one()
    if report:
        print("Report ID:", report.get('id'))
        print("Report number in DB:", report.get('report_number'))
        print("Report ccb_report_number in DB:", report.get('ccb_report_number'))
    else:
        print("No reports found!")

asyncio.run(check_db())
