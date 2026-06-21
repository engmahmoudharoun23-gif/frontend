import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timezone

async def test_delete():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    report_id = "6229cfcf-df6c-4059-ad3a-9ca581f0cb55"
    
    # 1. Find it
    report = await db.reports.find_one({"id": report_id, "is_deleted": True})
    if not report:
        print("Report not found in reports collection with is_deleted=True")
        return

    print(f"Found report: {report.get('report_number')}")
    
    # 2. Try to insert into permanently_deleted_reports
    permanently_deleted_report = {
        **report,
        "permanently_deleted": True,
        "permanently_deleted_at": datetime.now(timezone.utc).isoformat(),
        "permanently_deleted_by": "test_system"
    }
    
    try:
        # Remove _id if it exists to avoid conflict if already present
        if "_id" in permanently_deleted_report:
            del permanently_deleted_report["_id"]
            
        await db.permanently_deleted_reports.insert_one(permanently_deleted_report)
        print("Successfully inserted into permanently_deleted_reports")
    except Exception as e:
        print(f"Error inserting: {e}")
        return
        
    # 3. Try to delete
    try:
        res = await db.reports.delete_one({"id": report_id})
        print(f"Deleted count: {res.deleted_count}")
    except Exception as e:
        print(f"Error deleting: {e}")

if __name__ == "__main__":
    asyncio.run(test_delete())
