import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    MONGO_URL = "mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0"
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['wfm_reports']
    
    reports = await db.reports.find({"is_deleted": {"$type": "object"}}).to_list(None)
    print(f"Found {len(reports)} reports with object is_deleted.")
    for r in reports:
        print(r.get('id'), r.get('is_deleted'))

asyncio.run(main())
