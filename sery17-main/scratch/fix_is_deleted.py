import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    MONGO_URL = "mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0"
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['wfm_reports']
    
    # Find reports where is_deleted is not a boolean
    result = await db.reports.update_many(
        {"is_deleted": {"$ne": True}, "$expr": {"$eq": [{"$type": "$is_deleted"}, "object"]}},
        {"$set": {"is_deleted": False}}
    )
    print(f"Updated {result.modified_count} reports with object is_deleted.")
    
    # Update explicitly the two reports in Qasab just in case
    qasab = '\u0627\u0644\u0642\u0635\u0628'
    result2 = await db.reports.update_many(
        {"governorate": qasab, "is_deleted": {"$ne": True}},
        {"$set": {"is_deleted": False}}
    )
    print(f"Updated {result2.modified_count} reports in Qasab.")
    
    # Also find any remaining that might have been skipped
    result3 = await db.reports.update_many(
        {"is_deleted": {"$type": "object"}},
        {"$set": {"is_deleted": False}}
    )
    print(f"Updated {result3.modified_count} remaining reports with object is_deleted.")

asyncio.run(main())
