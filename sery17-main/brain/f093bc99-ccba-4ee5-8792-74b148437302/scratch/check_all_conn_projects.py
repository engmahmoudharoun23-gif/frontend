import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_all_connection_projects():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- Projects in water_connections ---")
    projects = await db.water_connections.distinct("project")
    for p in projects:
        count = await db.water_connections.count_documents({"project": p, "is_deleted": {"$ne": True}})
        print(f"Project: '{p}', Count: {count}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_all_connection_projects())
