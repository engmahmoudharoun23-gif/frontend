import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    docs = await db.reports.find({'governorate': {'$regex': 'شقراء'}}).to_list(10)
    for d in docs:
        print(f"ID: {d.get('id')}, Creator: {d.get('created_by_name')}, created_by: {d.get('created_by')}")

asyncio.run(run())
