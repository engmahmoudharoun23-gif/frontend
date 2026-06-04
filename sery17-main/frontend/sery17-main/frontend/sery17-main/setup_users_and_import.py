#!/usr/bin/env python3
"""
سكريبت إعداد المستخدمين واستيراد بلاغات مرات
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid
from passlib.context import CryptContext

# الاتصال بقاعدة البيانات
client = AsyncIOMotorClient('mongodb://localhost:27017')
db = client.wfm_db
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# بيانات البلاغات
reports_data = [
    {"report_number": "CCB-6601151416", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-6604877977", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-6602834414", "report_type": "ترابي", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-6601010902", "report_type": "ترابي", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-6600873350", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-6603195481", "report_type": "بلاط", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-6609763058", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-6604329103", "report_type": "ترابي", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-6604599311", "report_type": "ترابي", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-6604412442", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-6605314146", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-7356331113", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-6604577480", "report_type": "بلاط", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-6608081239", "report_type": "بلاط", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-6602848970", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-6606725608", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-6600945796", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-6604234438", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-6605038258", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-6600439203", "report_type": "بلاط", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-6607049790", "report_type": "ترابي", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-4564265229", "report_type": "ترابي", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-0798025845", "report_type": "بلاط", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-6603743163", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-6601672245", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0, "diameter_mm": 0},
    {"report_number": "CCB-6603047726", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160},
    {"report_number": "CCB-6604127261", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160},
    {"report_number": "CCB-6602915332", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 110},
    {"report_number": "CCB-6609729406", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160},
    {"report_number": "CCB-6603258476", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 25},
    {"report_number": "CCB-6602876068", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160},
    {"report_number": "CCB-6604191953", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 225},
    {"report_number": "CCB-6609896490", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.35, "diameter_mm": 225},
    {"report_number": "CCB-6604178553", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.0, "diameter_mm": 110},
    {"report_number": "CCB-6602032055", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.0, "diameter_mm": 160},
    {"report_number": "CCB-3281287777", "report_type": "بلاط", "contractor": "دار السمار للمقاولات", "depth_meters": 0.15, "diameter_mm": 20},
    {"report_number": "CCB-6601013170", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0.3, "diameter_mm": 25},
    {"report_number": "CCB-6600460635", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160},
    {"report_number": "CCB-6608644539", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.0, "diameter_mm": 160},
    {"report_number": "CCB-6609439368", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.2, "diameter_mm": 160},
    {"report_number": "CCB-6609934886", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 0.4, "diameter_mm": 25},
    {"report_number": "CCB-6602710387", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.0, "diameter_mm": 160},
    {"report_number": "CCB-6609570292", "report_type": "أسفلت", "contractor": "دار السمار للمقاولات", "depth_meters": 1.0, "diameter_mm": 20},
    {"report_number": "CCB-6600070216", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.2, "diameter_mm": 160},
    {"report_number": "CCB-6600789321", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 0.8, "diameter_mm": 20},
    {"report_number": "CCB-6601355075", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.0, "diameter_mm": 20},
    {"report_number": "CCB-6607084088", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 0.8, "diameter_mm": 20},
    {"report_number": "CCB-6605432517", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.0, "diameter_mm": 20},
    {"report_number": "CCB-6609662858", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.0, "diameter_mm": 25},
    {"report_number": "CCB-6602142712", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 0.5, "diameter_mm": 25},
    {"report_number": "CCB-6604455459", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.0, "diameter_mm": 25},
    {"report_number": "CCB-6601484882", "report_type": "بلاط", "contractor": "شركة الموسي(23)", "depth_meters": 1.0, "diameter_mm": 25},
    {"report_number": "CCB-6604240931", "report_type": "ترابي", "contractor": "شركة الموسي(23)", "depth_meters": 1.0, "diameter_mm": 64},
    {"report_number": "CCB-6603188766", "report_type": "ترابي", "contractor": "شركة الموسي(23)", "depth_meters": 0.15, "diameter_mm": 20},
    {"report_number": "CCB-6603712861", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.2, "diameter_mm": 160},
    {"report_number": "CCB-6604111017", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.2, "diameter_mm": 160},
    {"report_number": "CCB-6601400867", "report_type": "بلاط", "contractor": "شركة الموسي(23)", "depth_meters": 0.3, "diameter_mm": 20},
    {"report_number": "CCB-4307838481", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 0.2, "diameter_mm": 100},
    {"report_number": "CCB-18679530767853", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.2, "diameter_mm": 160},
    {"report_number": "CCB-40447877033104", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 0.6, "diameter_mm": 20},
    {"report_number": "CCB-11422917725151", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.2, "diameter_mm": 160},
    {"report_number": "CCB-49978770812320", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.2, "diameter_mm": 160},
    {"report_number": "CCB-13060832078550", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.2, "diameter_mm": 160},
    {"report_number": "CCB-50437699586773", "report_type": "ترابي", "contractor": "شركة الموسي(23)", "depth_meters": 0.3, "diameter_mm": 20},
    {"report_number": "CCB-06268648159446", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.2, "diameter_mm": 160},
    {"report_number": "CCB-15720338915707", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.2, "diameter_mm": 160},
    {"report_number": "CCB-88462740892902", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.2, "diameter_mm": 110},
    {"report_number": "CCB-56360568728134", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.0, "diameter_mm": 20},
    {"report_number": "CCB-78192743846686", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.2, "diameter_mm": 160},
    {"report_number": "CCB-10448285596052", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.2, "diameter_mm": 160},
    {"report_number": "CCB-02093266932155", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.2, "diameter_mm": 40},
    {"report_number": "CCB-44313910764529", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 0.8, "diameter_mm": 32},
    {"report_number": "CCB-62753126631547", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.2, "diameter_mm": 160},
    {"report_number": "CCB-38874255524253", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.0, "diameter_mm": 110},
    {"report_number": "CCB-98548675465666", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.0, "diameter_mm": 110},
    {"report_number": "CCB-60212651211843", "report_type": "بلاط", "contractor": "شركة الموسي(23)", "depth_meters": 0.4, "diameter_mm": 20},
    {"report_number": "CCB-22621842230756", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.2, "diameter_mm": 160},
    {"report_number": "CCB-02419105928392", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.2, "diameter_mm": 110},
    {"report_number": "CCB-45926904155939", "report_type": "بلاط", "contractor": "شركة الموسي(23)", "depth_meters": 0.3, "diameter_mm": 20},
    {"report_number": "CCB-78112802538326", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.2, "diameter_mm": 160},
    {"report_number": "CCB-52126230969766", "report_type": "ترابي", "contractor": "شركة الموسي(23)", "depth_meters": 1.0, "diameter_mm": 20},
    {"report_number": "CCB-94301203198618", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.2, "diameter_mm": 160},
    {"report_number": "CCB-10870441044836", "report_type": "أسفلت", "contractor": "شركة الموسي(23)", "depth_meters": 1.2, "diameter_mm": 32},
]

async def setup_and_import():
    """إعداد المستخدمين واستيراد البلاغات"""
    print("="*60)
    print("🚀 بدء عملية الإعداد والاستيراد")
    print("="*60)
    
    # 1. إنشاء/التحقق من المسؤول
    admin = await db.users.find_one({"username": "admin"})
    if not admin:
        print("\n📝 إنشاء مستخدم المسؤول (admin)...")
        admin = {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "email": "admin@wfm.com",
            "full_name": "المسؤول",
            "title": "المدير",
            "role": "admin",
            "governorates": [],
            "projects": [],
            "hashed_password": pwd_context.hash("admin123"),
            "created_by": None,
            "can_create_subusers": True,
            "created_at": datetime.now(timezone.utc),
            "is_active": True
        }
        await db.users.insert_one(admin)
        print(f"✅ تم إنشاء المسؤول: {admin['full_name']} (username: admin, password: admin123)")
    else:
        print(f"✅ المسؤول موجود: {admin['full_name']}")
    
    # 2. إنشاء/التحقق من محمد شوقي
    mohamed = await db.users.find_one({"full_name": "محمد شوقي"})
    if not mohamed:
        print("\n📝 إنشاء مستخدم محمد شوقي...")
        mohamed = {
            "id": str(uuid.uuid4()),
            "username": "mohamed_shawki",
            "email": "mohamed.shawki@wfm.com",
            "full_name": "محمد شوقي",
            "title": "المهندس",
            "role": "user",
            "governorates": ["مرات"],
            "projects": ["مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط"],
            "hashed_password": pwd_context.hash("password123"),
            "created_by": admin['id'],
            "can_create_subusers": False,
            "created_at": datetime.now(timezone.utc),
            "is_active": True
        }
        await db.users.insert_one(mohamed)
        print(f"✅ تم إنشاء المستخدم: {mohamed['full_name']}")
        print(f"   - Username: {mohamed['username']}")
        print(f"   - Password: password123")
        print(f"   - Governorates: {mohamed['governorates']}")
        print(f"   - Projects: {mohamed['projects']}")
    else:
        print(f"✅ المستخدم موجود: {mohamed['full_name']}")
    
    # 3. استيراد البلاغات
    print("\n" + "="*60)
    print("📊 استيراد بلاغات محافظة مرات")
    print("="*60)
    
    governorate = "مرات"
    project = "مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط"
    
    # التحقق من البلاغات الموجودة
    existing_reports = await db.reports.find({"governorate": governorate}, {"_id": 0, "report_number": 1}).to_list(None)
    existing_numbers = {r['report_number'] for r in existing_reports}
    
    print(f"\n📈 عدد البلاغات الموجودة في {governorate}: {len(existing_numbers)}")
    print(f"📥 عدد البلاغات في Excel: {len(reports_data)}")
    
    # إضافة البلاغات
    added_count = 0
    skipped_count = 0
    
    for idx, report_data in enumerate(reports_data, 1):
        if report_data['report_number'] in existing_numbers:
            print(f"⏭️  [{idx}/{len(reports_data)}] تخطي {report_data['report_number']} (موجود)")
            skipped_count += 1
            continue
        
        report = {
            "id": str(uuid.uuid4()),
            "report_number": report_data['report_number'],
            "license_number": "لا يوجد",
            "status": "تم الإصلاح",
            "governorate": governorate,
            "project": project,
            "report_type": report_data['report_type'],
            "depth_meters": report_data['depth_meters'],
            "diameter_mm": report_data['diameter_mm'],
            "contractor": report_data['contractor'],
            "latitude": None,
            "longitude": None,
            "asphalt_license_issued": False,
            "images": [],
            "created_by": mohamed['id'],
            "created_by_name": mohamed['full_name'],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "closed_at": datetime.now(timezone.utc).isoformat(),
            "is_deleted": False,
            "deleted_at": None,
            "deleted_by": None,
            "permanently_deleted": False,
            "permanently_deleted_at": None,
            "permanently_deleted_by": None
        }
        
        await db.reports.insert_one(report)
        print(f"✅ [{idx}/{len(reports_data)}] تم إضافة {report_data['report_number']}")
        added_count += 1
    
    # النتائج النهائية
    print("\n" + "="*60)
    print("🎉 اكتمل الإعداد والاستيراد!")
    print("="*60)
    print(f"\n👥 المستخدمون:")
    print(f"   - المسؤول: admin / admin123")
    print(f"   - محمد شوقي: mohamed_shawki / password123")
    print(f"\n📊 البلاغات:")
    print(f"   - تم الإضافة: {added_count}")
    print(f"   - تم التخطي (موجودة): {skipped_count}")
    print(f"   - الإجمالي في Excel: {len(reports_data)}")
    print(f"\n✅ البلاغات ستظهر في:")
    print(f"   1. حساب المسؤول (admin) - يرى جميع البلاغات")
    print(f"   2. حساب المشروع - المستخدمون المخصصون للمشروع الغربي")
    print(f"   3. حساب محمد شوقي - يرى فقط بلاغات محافظة مرات")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(setup_and_import())
