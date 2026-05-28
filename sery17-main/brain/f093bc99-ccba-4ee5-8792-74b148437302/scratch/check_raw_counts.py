import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_raw_counts():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    projects = [
        "مشروع المحافظات الغربية - القطاع الأوسط",
        "مشروع كشف التسربات وإصلاحها"
    ]
    
    for p in projects:
        print(f"\n--- Checking project: {p} ---")
        # No filters
        total = await db.reports.count_documents({"project": p})
        # Not deleted
        not_deleted = await db.reports.count_documents({"project": p, "is_deleted": {"$ne": True}})
        # Deleted
        deleted = await db.reports.count_documents({"project": p, "is_deleted": True})
        
        print(f"Total: {total}, Not Deleted: {not_deleted}, Deleted: {deleted}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_raw_counts())
