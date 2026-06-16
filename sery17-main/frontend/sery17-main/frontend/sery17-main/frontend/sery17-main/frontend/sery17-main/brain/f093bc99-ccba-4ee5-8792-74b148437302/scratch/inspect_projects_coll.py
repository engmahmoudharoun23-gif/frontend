import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_projects():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- Projects in projects collection ---")
    projects = await db.projects.find({}, {"name": 1}).to_list(100)
    for p in projects:
        name = p.get("name")
        print(f"'{name}'")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_projects())
