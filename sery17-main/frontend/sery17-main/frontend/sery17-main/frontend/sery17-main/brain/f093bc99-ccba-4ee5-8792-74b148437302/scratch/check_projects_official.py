import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_projects():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    projects = await db.projects.find({}, {"name": 1}).to_list(100)
    print("--- Projects in projects collection ---")
    for p in projects:
        print(f"Project Name: '{p['name']}'")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_projects())
