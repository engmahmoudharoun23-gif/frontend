import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def debug_all_statuses():
    client = AsyncIOMotorClient(os.getenv("MONGO_URL", "mongodb://localhost:27017"))
    db = client[os.getenv("DB_NAME", "wfm_reports")]
    
    # جلب جميع الحالات الفريدة في القاعدة
    unique_statuses = await db.reports.distinct("status")
    
    print(f"Unique statuses in DB (ascii): {[ascii(s) for s in unique_statuses]}")
    
    for s in unique_statuses:
        count = await db.reports.count_documents({"status": s})
        print(f"Status: {ascii(s)}, Count: {count}")

if __name__ == "__main__":
    asyncio.run(debug_all_statuses())
