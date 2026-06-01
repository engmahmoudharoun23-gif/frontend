import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.wfm_reports
    
    print("--- Projects in water_connections ---")
    projects_water = await db.water_connections.distinct('project')
    print(projects_water)
    
    print("\n--- Projects in sewage_connections ---")
    projects_sewage = await db.sewage_connections.distinct('project')
    print(projects_sewage)
    
    # Check if there are any records at all
    count_water = await db.water_connections.count_documents({})
    print(f"\nTotal water connections: {count_water}")
    
    count_sewage = await db.sewage_connections.count_documents({})
    print(f"Total sewage connections: {count_sewage}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
