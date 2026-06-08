import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def fix_data():
    client = AsyncIOMotorClient(os.getenv("MONGO_URL", "mongodb://localhost:27017"))
    db = client[os.getenv("DB_NAME", "wfm_reports")]
    
    # 1. تصحيح الحالات التي تحولت بالخطأ إلى "مغلق WFM" في حقل الحالة الأساسي
    # نبحث عن "مغلق WFM" ونعيدها إلى "تم الإصلاح"
    result = await db.reports.update_many(
        {"status": "مغلق WFM"},
        {"$set": {"status": "تم الإصلاح"}}
    )
    print(f"Updated {result.modified_count} reports status.")
    
    print("Done.")

if __name__ == "__main__":
    asyncio.run(fix_data())
