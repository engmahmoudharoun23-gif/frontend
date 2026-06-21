import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    MONGO_URL = "mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0"
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['wfm_reports']
    
    qasab = '\u0627\u0644\u0642\u0635\u0628'
    
    reports = await db.reports.find({'governorate': qasab}).to_list(length=100)
    for r in reports:
        print(f"ID: {r.get('id')} | Project: {r.get('project').encode('utf-8')}")

asyncio.run(main())
