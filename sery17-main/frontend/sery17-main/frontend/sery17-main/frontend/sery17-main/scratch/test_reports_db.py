import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    reports = await db.reports.find().to_list(100)
    for r in reports:
        print(f"Project: {r.get('project')}, Start Date: {r.get('start_date')}, Created At: {r.get('created_at')}")

asyncio.run(test())
