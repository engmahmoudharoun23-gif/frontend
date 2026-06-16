import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv('d:/sery17-main/sery17-main/backend/.env')
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")

async def main():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client.sery17
    
    # 1. Find all reports that are seen
    reports = await db.reports.find({"seen_by": {"$exists": True, "$ne": []}}).to_list(10)
    if not reports:
        print("No seen reports.")
        return
        
    print(f"Found {len(reports)} seen reports.")
    for r in reports:
        print(f"Report: {r.get('report_number')} - Seen by: {r.get('seen_by')} - Deleted Notif: {r.get('deleted_notifications', [])}")
        
    # Pick the first user in seen_by
    user_id = reports[0]["seen_by"][0]
    user = await db.users.find_one({"id": user_id})
    print(f"\nUser testing: {user.get('username')} (Admin: {user.get('role') == 'admin'})")
    print(f"Govs: {user.get('governorates')}")
    
    # Try the exact clear query
    rq = {
        "is_deleted": {"$ne": True},
        "seen_by": user_id
    }
    
    count_before = await db.reports.count_documents(rq)
    print(f"\nReports matching the base query (seen_by={user_id}): {count_before}")
    
    if user.get('role') != 'admin':
        # Add the filter
        govs = user.get('governorates', [])
        if govs:
            expanded_govs = []
            for g in govs:
                clean_g = g.replace("محافظة ", "").replace("محافظه ", "").strip()
                expanded_govs.extend([g, clean_g, f"محافظة {clean_g}", f"محافظه {clean_g}"])
            rq["governorate"] = {"$in": expanded_govs}
            
        count_filtered = await db.reports.count_documents(rq)
        print(f"Reports matching the filtered query: {count_filtered}")
        
    print("Base query:", rq)

if __name__ == "__main__":
    asyncio.run(main())
