import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    local_db = AsyncIOMotorClient('mongodb://localhost:27017')['wfm_reports']
    atlas_db = AsyncIOMotorClient('mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0')['wfm_reports']
    
    local_reports = await local_db.reports.find().to_list(10000)
    print(f"Total reports in local DB: {len(local_reports)}")
    restored = 0
    for r in local_reports:
        gov = str(r.get('governorate', ''))
        if 'شقراء' in gov:
            exists = await atlas_db.reports.find_one({"id": r["id"]})
            if not exists:
                await atlas_db.reports.insert_one(r)
                restored += 1
                print(f"Restored report {r['id']} to Atlas!")
    print(f"Total restored: {restored}")

if __name__ == '__main__':
    asyncio.run(test())
