import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    reports = await db.reports.find({}, {'id': 1, 'governorate': 1, 'project': 1, 'created_at': 1}).to_list(length=100)
    for r in reports:
        # Encode to avoid cmd print issues
        gov = r.get('governorate', '').encode('utf-8')
        proj = r.get('project', '').encode('utf-8')
        print(f"ID: {r.get('id')} | Gov: {gov} | Proj: {proj} | Created: {r.get('created_at')}")

asyncio.run(main())
