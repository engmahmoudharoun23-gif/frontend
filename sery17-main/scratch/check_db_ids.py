import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0')
    db = client.wfm_reports
    
    reports = await db.reports.find({'seen_by': {'$exists': True}}).limit(5).to_list(5)
    for r in reports:
        print(f"Report {r.get('id')}, seen_by: {r.get('seen_by')}")
        if r.get('seen_by'):
            print(f"Type of elements: {[type(x) for x in r.get('seen_by')]}")

    users = await db.users.find().limit(2).to_list(2)
    for u in users:
        print(f"User {u.get('id')}, type: {type(u.get('id'))}")

asyncio.run(main())
