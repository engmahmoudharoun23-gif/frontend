from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import sys
import codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

async def check_name_mismatch():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- Projects in 'projects' collection ---")
    async for p in db.projects.find():
        print(f"Project Name: '{p.get('name')}'")
        
    print("\n--- Projects in 'water_connections' ---")
    projects_w = await db.water_connections.distinct("project")
    print(projects_w)
    
    print("\n--- Projects in 'sewage_connections' ---")
    projects_s = await db.sewage_connections.distinct("project")
    print(projects_s)

    client.close()

if __name__ == "__main__":
    asyncio.run(check_name_mismatch())
