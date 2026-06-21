import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def check_data():
    client = AsyncIOMotorClient(os.getenv("MONGO_URL", "mongodb://localhost:27017"))
    db = client[os.getenv("DB_NAME", "wfm_reports")]
    
    # البحث عن أي بلاغ يحتوي على "WFM" في حقل الحالة
    cursor = db.reports.find({"status": {"$regex": "WFM"}})
    reports = await cursor.to_list(length=100)
    
    print(f"Found {len(reports)} reports with WFM in status.")
    for r in reports:
        # استخدام repr لإظهار الحروف الحقيقية
        print(f"ID: {r.get('id')}, Status: {repr(r.get('status'))}")

if __name__ == "__main__":
    asyncio.run(check_data())
