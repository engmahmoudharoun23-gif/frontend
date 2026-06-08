import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_projects_in_reports():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- Projects in reports collection (REPR) ---")
    projects = await db.reports.distinct("project")
    for p in projects:
        count = await db.reports.count_documents({"project": p, "is_deleted": {"$ne": True}})
        print(f"Project: {repr(p)}, Count: {count}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_projects_in_reports())
