import asyncio, sys
sys.stdout.reconfigure(encoding='utf-8')
from motor.motor_asyncio import AsyncIOMotorClient

async def clean():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    # عدد السجلات قبل الحذف
    before = await db.project_governorates.count_documents({})
    before_del = await db.deleted_governorates.count_documents({})
    print(f"قبل الحذف: {before} محافظة نشطة, {before_del} محافظة محذوفة")
    
    # حذف جميع المحافظات النشطة
    r1 = await db.project_governorates.delete_many({})
    print(f"✅ تم حذف {r1.deleted_count} محافظة من project_governorates")
    
    # حذف جميع المحافظات المحذوفة مسبقاً
    r2 = await db.deleted_governorates.delete_many({})
    print(f"✅ تم حذف {r2.deleted_count} من deleted_governorates")
    
    # التأكد
    after = await db.project_governorates.count_documents({})
    print(f"✅ قاعدة البيانات نظيفة — المحافظات المتبقية: {after}")
    print("يمكنك الآن إضافة المحافظات لكل مشروع بشكل مستقل.")
    
    client.close()

asyncio.run(clean())
