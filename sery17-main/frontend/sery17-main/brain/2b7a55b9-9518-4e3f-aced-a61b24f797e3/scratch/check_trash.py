
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_deleted_reports():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("Checking deleted reports...")
    deleted_reports = await db.reports.find({"is_deleted": True}).to_list(100)
    print(f"Found {len(deleted_reports)} deleted reports.")
    
    for r in deleted_reports:
        print(f"ID: {r.get('id')}, Number: {r.get('report_number')}, Project: {r.get('project')}, DeletedBy: {r.get('deleted_by')}, DeletedAt: {r.get('deleted_at')}")

    # Check specifically for Riyadh project
    riyadh_reports = await db.reports.find({"project": "الرياض", "is_deleted": True}).to_list(100)
    print(f"\nFound {len(riyadh_reports)} deleted reports in Riyadh project.")
    for r in riyadh_reports:
        print(f"ID: {r.get('id')}, Number: {r.get('report_number')}, DeletedBy: {r.get('deleted_by')}")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_deleted_reports())
