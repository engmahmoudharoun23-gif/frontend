
import motor.motor_asyncio
import asyncio

async def list_unique_projects():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    # Get unique project names
    projects = await db.reports.distinct("project")
    print("Unique projects in 'reports' collection:")
    for p in projects:
        print(f" - '{p}'")
    
    # Count reports for anything with "غربية"
    count = await db.reports.count_documents({"project": {"$regex": "غربية", "$options": "i"}})
    print(f"\nTotal reports with 'غربية' in name: {count}")
    
    # Sample a report with "غربية"
    if count > 0:
        sample = await db.reports.find_one({"project": {"$regex": "غربية", "$options": "i"}})
        print(f"Sample project name: '{sample.get('project')}'")

asyncio.run(list_unique_projects())
