
import motor.motor_asyncio
import asyncio

async def count_raw():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    total = await db.reports.count_documents({})
    print(f"Total raw reports in collection: {total}")
    
    # Check for any reports with governorate Afif
    afif = await db.reports.count_documents({"governorate": {"$regex": "عفيف", "$options": "i"}})
    print(f"Total Afif (including deleted): {afif}")

asyncio.run(count_raw())
