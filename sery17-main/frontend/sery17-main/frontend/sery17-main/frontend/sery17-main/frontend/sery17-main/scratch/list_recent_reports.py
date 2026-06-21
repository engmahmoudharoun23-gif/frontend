import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def list_last_modified():
    client = AsyncIOMotorClient(os.getenv("MONGO_URL", "mongodb://localhost:27017"))
    db = client[os.getenv("DB_NAME", "wfm_reports")]
    
    # جلب آخر 20 بلاغ تم تعديلهم
    reports = await db.reports.find().sort("updated_at", -1).limit(20).to_list(20)
    
    print(f"Showing last 20 modified reports:")
    for r in reports:
        print(f"ID: {r.get('id')}, Status: {ascii(r.get('status'))}, WFM Closed: {r.get('wfm_closed')}, Updated At: {r.get('updated_at')}")

if __name__ == "__main__":
    asyncio.run(list_last_modified())
