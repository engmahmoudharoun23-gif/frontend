import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_projects():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    projects = await db.projects.find({}, {"_id": 0}).to_list(100)
    print(f"Projects count: {len(projects)}")
    for p in projects:
        print(f"Project: {p}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_projects())
