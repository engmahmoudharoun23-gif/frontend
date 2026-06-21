import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def list_statuses():
    client = AsyncIOMotorClient(os.getenv("MONGO_URL", "mongodb://localhost:27017"))
    db = client[os.getenv("DB_NAME", "wfm_reports")]
    
    reports = await db.reports.find({"is_deleted": False}).to_list(100)
    
    unique_statuses = set()
    for r in reports:
        status = r.get("status")
        if status:
            unique_statuses.add(status)
        
    for s in unique_statuses:
        print(f"Status: {ascii(s)}")

if __name__ == "__main__":
    asyncio.run(list_statuses())
