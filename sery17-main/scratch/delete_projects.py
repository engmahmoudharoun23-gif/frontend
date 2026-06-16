import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def delete_projects():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    result = await db["projects"].delete_many({})
    print(f"Deleted {result.deleted_count} projects from local DB.")
    
if __name__ == "__main__":
    asyncio.run(delete_projects())
