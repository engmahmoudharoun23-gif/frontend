from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def check():
    client = AsyncIOMotorClient(os.getenv("MONGO_URL", "mongodb://localhost:27017"))
    db = client[os.getenv("DB_NAME", "wfm_reports")]
    
    # Get one report
    report = await db.reports.find_one({"is_deleted": False})
    if report:
        print(f"Report structure: {report.keys()}")
        print(f"ID: {report.get('id')}")
        print(f"WFM Closed: {report.get('wfm_closed')}")
        print(f"Status: {report.get('status')}")
        print(f"Review Status: {report.get('review_status')}")
    else:
        print("No reports found")

if __name__ == "__main__":
    asyncio.run(check())
