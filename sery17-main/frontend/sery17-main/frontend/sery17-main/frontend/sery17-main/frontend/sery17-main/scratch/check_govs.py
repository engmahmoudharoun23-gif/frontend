import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    p1 = "مشروع المحافظات الغربية -القطاع الأوسط"
    p2 = "مشروع كشف التسربات وإصلاحها"
    
    govs1 = await db.reports.distinct('governorate', {"project": p1})
    govs2 = await db.reports.distinct('governorate', {"project": p2})
    
    print(f"Govs Project 1: {govs1}")
    print(f"Govs Project 2: {govs2}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
