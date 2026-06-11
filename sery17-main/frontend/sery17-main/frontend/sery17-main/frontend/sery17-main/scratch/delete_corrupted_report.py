import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def delete_corrupted_report():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    # Target report ID: 6a0a3a9b5055f160d128b5d6
    # Let's delete this specific report
    report_id = "6a0a3a9b5055f160d128b5d6"
    result = await db.reports.delete_one({"_id": ObjectId(report_id)})
    print(f"Deleted report count by ID: {result.deleted_count}")
    
    # Let's also check if there are any other reports in the database
    remaining_count = await db.reports.count_documents({})
    print(f"Remaining reports in database: {remaining_count}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(delete_corrupted_report())
