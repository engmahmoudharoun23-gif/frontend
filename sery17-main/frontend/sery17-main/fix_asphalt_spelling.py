#!/usr/bin/env python3
"""
تصحيح كتابة "إسفلت" إلى "أسفلت" في جميع البلاغات
"""
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / 'backend' / '.env')

async def fix_spelling():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🔄 جاري تصحيح كتابة الأسفلت...")
    
    # البحث عن جميع البلاغات التي تحتوي على "إسفلت" أو "اسفلت"
    wrong_spellings = ['إسفلت', 'اسفلت', 'إسفالت', 'اسفالت']
    
    total_updated = 0
    for wrong in wrong_spellings:
        result = await db.reports.update_many(
            {'report_type': wrong},
            {'$set': {'report_type': 'أسفلت'}}
        )
        if result.modified_count > 0:
            print(f"✅ تم تحديث {result.modified_count} بلاغ من '{wrong}' إلى 'أسفلت'")
            total_updated += result.modified_count
    
    print(f"\n✅ إجمالي البلاغات المحدثة: {total_updated}")
    
    # عرض الإحصائيات النهائية
    pipeline = [
        {'$match': {'is_deleted': False}},
        {'$group': {'_id': '$report_type', 'count': {'$sum': 1}}}
    ]
    result = await db.reports.aggregate(pipeline).to_list(10)
    
    print("\n📊 الإحصائيات النهائية:")
    for item in result:
        print(f"   {item['_id']}: {item['count']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_spelling())
