import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    db = AsyncIOMotorClient('mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0')['wfm_reports']
    reports = await db.reports.find({}).sort("_id", -1).limit(5).to_list(5)
    for r in reports:
        print("Report ID:", r.get('id'), "Project:", r.get('project'))
        print("Created by:", r.get('created_by'))
        print("Date:", r.get('created_at'))
        print("Gov:", r.get('governorate'))
        print("---")
if __name__ == '__main__':
    asyncio.run(test())
