from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from datetime import datetime

async def check_reports():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    projects = ["ايصال", "ايصال الرياض"]
    
    print("--- Reports Count ---")
    for project in projects:
        count = await db.reports.count_documents({"project": project})
        print(f"Project '{project}': {count} reports")
        
        # Breakdown by category
        categories = ["توصيلة مياه", "توصيلة صرف صحي"]
        for cat in categories:
            cat_count = await db.reports.count_documents({"project": project, "category": cat})
            print(f"  - {cat}: {cat_count}")
            
        # Inspect a few reports to see their structure
        async for report in db.reports.find({"project": project}).limit(5):
            print(f"  Report ID: {report.get('id') or report.get('_id')}")
            print(f"    Category: {report.get('category')}")
            print(f"    Status: {report.get('status')}")
            print(f"    Created At: {report.get('created_at')}")
            print(f"    Received At: {report.get('received_at')}")
            print(f"    Project: {report.get('project')}")
            print("-" * 20)

    client.close()

if __name__ == "__main__":
    asyncio.run(check_reports())
