import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def final_fix():
    client = AsyncIOMotorClient(os.getenv("MONGO_URL", "mongodb://localhost:27017"))
    db = client[os.getenv("DB_NAME", "wfm_reports")]
    
    # تصحيح أي حالة تحتوي على "WFM" أو "مغلق" أو "قيد المعالجة" (إذا كانت ناتجة عن خطأ التبديل)
    # سنعيدها جميعاً إلى "تم الإصلاح" كما طلب المستخدم
    
    # 1. البحث عن الحالات التي تحتوي على كلمة "WFM"
    res1 = await db.reports.update_many(
        {"status": {"$regex": "WFM"}},
        {"$set": {"status": "تم الإصلاح"}}
    )
    print(f"Fixed {res1.modified_count} reports with 'WFM' in status.")
    
    # 2. البحث عن الحالات التي أصبحت "قيد المعالجة" بالخطأ (وهي عادة تكون "تم الإصلاح")
    # ملاحظة: سنقوم بتغييرها فقط إذا كان البلاغ مقفل WFM أو كان أصلاً بلاغ إصلاح
    res2 = await db.reports.update_many(
        {"status": "قيد المعالجة"},
        {"$set": {"status": "تم الإصلاح"}}
    )
    print(f"Fixed {res2.modified_count} reports with 'قيد المعالجة' in status.")
    
    # 3. البحث عن "مغلق" أو "مقفلة"
    res3 = await db.reports.update_many(
        {"status": {"$regex": "مغلق|مقفلة"}},
        {"$set": {"status": "تم الإصلاح"}}
    )
    print(f"Fixed {res3.modified_count} reports with 'مغلق/مقفلة' in status.")

if __name__ == "__main__":
    asyncio.run(final_fix())
