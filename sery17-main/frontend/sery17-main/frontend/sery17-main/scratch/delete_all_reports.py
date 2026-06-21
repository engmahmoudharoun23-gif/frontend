import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    MONGO_URL = "mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0"
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['wfm_reports']
    
    # Delete all documents from the reports collection
    result = await db.reports.delete_many({})
    print(f"Successfully deleted {result.deleted_count} reports from all projects.")

asyncio.run(main())
