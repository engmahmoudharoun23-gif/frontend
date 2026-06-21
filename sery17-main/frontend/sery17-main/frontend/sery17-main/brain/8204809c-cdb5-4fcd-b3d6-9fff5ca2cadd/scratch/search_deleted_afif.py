
import motor.motor_asyncio
import asyncio

async def search_deleted_afif():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    count = await db.reports.count_documents({"governorate": {"$regex": "عفيف", "$options": "i"}, "is_deleted": True})
    print(f"Deleted reports in Afif: {count}")
    
    count_muza = await db.reports.count_documents({"governorate": {"$regex": "المزاحمية", "$options": "i"}, "is_deleted": True})
    print(f"Deleted reports in Muza: {count_muza}")

asyncio.run(search_deleted_afif())
