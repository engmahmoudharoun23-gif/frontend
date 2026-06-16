import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_projects():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    projects = await db["projects"].find({}).to_list(None)
    print(f"Total projects found: {len(projects)}")
    
    for p in projects:
        project_name = p.get('name')
        # Check if any report uses this project name
        report_count = await db["reports"].count_documents({"project": project_name})
        print(f"Project: '{project_name}' - Reports attached: {report_count}")
        
if __name__ == "__main__":
    asyncio.run(check_projects())
