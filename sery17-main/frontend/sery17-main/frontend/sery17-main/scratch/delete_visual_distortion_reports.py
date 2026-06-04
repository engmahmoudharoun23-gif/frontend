import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def delete_reports():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    # Let's find all reports related to the project "التشوه البصري"
    # Wait, let's first list what reports exist for projects containing "تشوه" or "التشوه البصري"
    cursor = db.reports.find({"project": {"$regex": "تشوه|$التشوه البصري"}})
    reports = await cursor.to_list(length=100)
    
    print(f"Found {len(reports)} reports matching project containing 'تشوه' or 'التشوه البصري'")
    for r in reports:
        print(f"Report ID: {r.get('_id')}, Project: {r.get('project')}, Title/Desc: {r.get('description', '')[:50]}")
        
    # Delete them permanently
    if len(reports) > 0:
        result = await db.reports.delete_many({"project": {"$regex": "تشوه|$التشوه البصري"}})
        print(f"Permanently deleted {result.deleted_count} reports.")
    else:
        print("No matching reports found to delete.")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(delete_reports())
