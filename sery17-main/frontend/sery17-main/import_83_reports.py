#!/usr/bin/env python3
"""
سكريبت لاستيراد الـ 83 بلاغ إلى قاعدة البيانات
"""
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / 'backend' / '.env')

# بيانات البلاغات (83 بلاغ)
reports_data = [
    {"report_number": "CCB-6601151416", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-6604877977", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-6602834414", "report_type": "ترابي", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-6601010902", "report_type": "ترابي", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-6600873350", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603195481", "report_type": "بلاط", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-6609763058", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-6604329103", "report_type": "ترابي", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-6604599311", "report_type": "ترابي", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-6604412442", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-6605314146", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-7356331113", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-6604577480", "report_type": "بلاط", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-6608081239", "report_type": "بلاط", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-6602848970", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-6606725608", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-6600945796", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-6604234438", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-6605038258", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-6600439203", "report_type": "بلاط", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-6607049790", "report_type": "ترابي", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-4564265229", "report_type": "ترابي", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-0798025845", "report_type": "بلاط", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603743163", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-6601672245", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603047726", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6604127261", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6602915332", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 110, "status": "تم الإصلاح"},
    {"report_number": "CCB-6609729406", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603258476", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 25, "status": "تم الإصلاح"},
    {"report_number": "CCB-6602876068", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6604191953", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 225, "status": "تم الإصلاح"},
    {"report_number": "CCB-6604854673", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6600905878", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 110, "status": "تم الإصلاح"},
    {"report_number": "CCB-6602902619", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6602905451", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6601034698", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 200, "status": "تم الإصلاح"},
    {"report_number": "CCB-6600890968", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6602872821", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603267291", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603247062", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603243867", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603254158", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6601066976", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 110, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603244732", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603264936", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603264927", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603242104", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6600899516", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603282863", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 110, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603242154", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603242122", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603244730", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603251908", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603251928", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603264964", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603268027", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6601067009", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 110, "status": "تم الإصلاح"},
    {"report_number": "CCB-6601061001", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 110, "status": "تم الإصلاح"},
    {"report_number": "CCB-6600902699", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603282872", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 110, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603267318", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603267316", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6601066967", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 110, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603244690", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603244686", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603268001", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603246548", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603246507", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603244646", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603246531", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603267283", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603268072", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603244716", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603246558", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603244692", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603268007", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603244666", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603244725", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603267342", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603244684", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
    {"report_number": "CCB-6603267349", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160, "status": "تم الإصلاح"},
]

async def import_reports():
    """استيراد الـ 83 بلاغ"""
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🔄 جاري استيراد الـ 83 بلاغ...")
    print("=" * 60)
    
    # جلب مستخدم "Mohamed Shawqi" لاستخدامه كـ created_by
    mohamed_user = await db.users.find_one({"username": "Mohamed Shawqi"}, {"_id": 0})
    
    if not mohamed_user:
        print("❌ خطأ: لم يتم العثور على المستخدم 'Mohamed Shawqi'")
        return
    
    creator_id = mohamed_user['id']
    print(f"✅ المُنشئ: {mohamed_user['full_name']} (ID: {creator_id})")
    
    governorate = "مرات"
    project = "مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط"
    
    # التحقق من البلاغات الموجودة
    existing_reports = await db.reports.find(
        {"is_deleted": False},
        {"_id": 0, "report_number": 1}
    ).to_list(None)
    existing_numbers = {r['report_number'] for r in existing_reports}
    
    print(f"\n📊 الإحصائيات:")
    print(f"   - البلاغات الموجودة: {len(existing_numbers)}")
    print(f"   - البلاغات المراد استيرادها: {len(reports_data)}")
    
    # إضافة البلاغات الجديدة
    added_count = 0
    skipped_count = 0
    
    for report_data in reports_data:
        if report_data['report_number'] in existing_numbers:
            skipped_count += 1
            continue
        
        # إنشاء البلاغ
        report = {
            "id": str(uuid.uuid4()),
            "report_number": report_data['report_number'],
            "report_date": None,
            "license_number": f"LIC-{report_data['report_number'][-6:]}",
            "report_type": report_data['report_type'],
            "status": report_data['status'],
            "governorate": governorate,
            "project": project,
            "depth_meters": report_data['depth_meters'],
            "diameter_mm": report_data['diameter_mm'],
            "contractor": report_data['contractor'],
            "latitude": None,
            "longitude": None,
            "asphalt_license_issued": False,
            "images": [],
            "created_by": creator_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "closed_at": None,
            "is_deleted": False,
            "deleted_at": None,
            "deleted_by": None,
            "permanently_deleted": False,
            "permanently_deleted_at": None,
            "permanently_deleted_by": None
        }
        
        await db.reports.insert_one(report)
        added_count += 1
        
        if added_count % 10 == 0:
            print(f"   ⏳ تم إضافة {added_count} بلاغ...")
    
    print("\n" + "=" * 60)
    print("✅ اكتمل الاستيراد!")
    print(f"   - تم إضافة: {added_count} بلاغ")
    print(f"   - تم تخطي: {skipped_count} بلاغ (موجود مسبقاً)")
    print(f"   - الإجمالي النهائي: {len(existing_numbers) + added_count} بلاغ")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(import_reports())
