import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    p1 = "مشروع المحافظات الغربية -القطاع الأوسط"
    
    count_false = await db.reports.count_documents({"project": p1, "is_deleted": False})
    count_none = await db.reports.count_documents({"project": p1, "is_deleted": {"$exists": False}})
    count_ne_true = await db.reports.count_documents({"project": p1, "is_deleted": {"$ne": True}})
    
    print(f"False: {count_false}")
    print(f"Exists False (None): {count_none}")
    print(f"Not Equal True: {count_ne_true}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
