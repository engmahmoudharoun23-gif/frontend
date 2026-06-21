
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def simulate_api_call():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    # Simulate admin user
    current_user_id = "4b8c3530-467d-4285-9f37-f54d9d2dcace" # From my previous script output
    
    base_query = {"is_deleted": True, "deleted_by": {"$exists": True}}
    
    # Reports query
    rep_query = {**base_query}
    total_count = await db.reports.count_documents(rep_query)
    print(f"Total deleted reports (matching query): {total_count}")
    
    fetch_limit = 30 # page 1, limit 30
    reports = await db.reports.find(
        rep_query, 
        {"id": 1, "report_number": 1, "project": 1, "status": 1, "deleted_at": 1, "deleted_by": 1, "governorate": 1, "report_type": 1, "notes": 1}
    ).sort("deleted_at", -1).limit(fetch_limit).to_list(fetch_limit)
    
    print(f"Fetched {len(reports)} reports.")
    for r in reports:
        print(f"Report: {r.get('report_number')}, Project: {r.get('project')}, DeletedAt: {r.get('deleted_at')}")

    client.close()

if __name__ == "__main__":
    asyncio.run(simulate_api_call())
