import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    docs = await db.reports.find({'governorate': {'$regex': 'شقراء'}}).to_list(10)
    for d in docs:
        print(f"ID: {d.get('id')}, Proj: {d.get('project')}, Gov: {d.get('governorate')}, Creator: {d.get('created_by_name')}")

asyncio.run(run())
