
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_all_deleted_projects():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    projects = await db.reports.distinct("project", {"is_deleted": True})
    for p in projects:
        print(f"Project: {p}, Hex: {p.encode('utf-8').hex() if p else 'None'}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_all_deleted_projects())
