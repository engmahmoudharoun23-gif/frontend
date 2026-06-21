import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_projects():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- Projects in water_connections ---")
    water_projects = await db.water_connections.distinct("project")
    for p in water_projects:
        print(f"'{p}'")
        
    print("\n--- Projects in sewage_connections ---")
    sewage_projects = await db.sewage_connections.distinct("project")
    for p in sewage_projects:
        print(f"'{p}'")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_projects())
