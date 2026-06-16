import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_record_dates():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    projects = ["مشروع أعمال المحافظات الغربية - القطاع الأوسط", "مشروع كشف التسربات وإصلاحها"]
    for p in projects:
        print(f"--- Dates for project: {p} ---")
        docs = await db.reports.find({"project": {"$regex": p}}, {"created_at": 1}).limit(5).to_list(5)
        for doc in docs:
            print(f"Date: {doc.get('created_at')}")
            
    client.close()

if __name__ == "__main__":
    asyncio.run(check_record_dates())
