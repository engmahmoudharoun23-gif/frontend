
import motor.motor_asyncio
import asyncio

async def search_afif_fuzzy():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    # Search for anything that sounds like Afif
    patterns = ["عفيف", "عيف", "افيف"]
    for p in patterns:
        count = await db.reports.count_documents({"governorate": {"$regex": p, "$options": "i"}})
        print(f"Pattern: {p}, Count: {count}")

asyncio.run(search_afif_fuzzy())
