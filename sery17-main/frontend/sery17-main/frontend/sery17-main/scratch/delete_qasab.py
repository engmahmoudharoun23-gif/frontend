import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    qasab = '\u0627\u0644\u0642\u0635\u0628'
    
    for coll_name in ['safety_reports', 'quality_reports', 'business_reports']:
        res = await db[coll_name].delete_many({'governorate': qasab})
        print(f"Deleted {res.deleted_count} from {coll_name}")

asyncio.run(main())
