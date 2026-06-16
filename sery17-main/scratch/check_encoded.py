import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    db = AsyncIOMotorClient('mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0')['wfm_reports']
    us = await db.users.find().to_list(10)
    for u in us:
        for p in u.get('projects', []):
            if 'الموس' in p:
                print("User", u.get('username'), "has project:", repr(p.encode('utf-8')))

    reports = await db.reports.find().sort("_id", -1).limit(5).to_list(5)
    for r in reports:
        if r.get('project') and 'الموس' in r.get('project', ''):
            print("Report ID:", r.get('id'), "Project:", repr(r.get('project').encode('utf-8')))
if __name__ == '__main__':
    asyncio.run(test())
