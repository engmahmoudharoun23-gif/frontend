import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    MONGO_URL = "mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0"
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['wfm_reports']
    
    qasab = '\u0627\u0644\u0642\u0635\u0628'
    
    # Check all report collections just in case
    for coll_name in ['reports', 'safety_reports', 'quality_reports', 'business_reports']:
        res = await db[coll_name].delete_many({'governorate': qasab})
        print(f"Deleted {res.deleted_count} from {coll_name}")

asyncio.run(main())
