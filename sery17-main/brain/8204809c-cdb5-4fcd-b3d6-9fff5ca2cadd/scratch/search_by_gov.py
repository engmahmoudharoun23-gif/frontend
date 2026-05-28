
import motor.motor_asyncio
import asyncio

async def search_by_gov():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    # Search for reports in typical Western governorates like "المزاحمية"
    govs = ["المزاحمية", "ضرماء", "القصب", "مرات", "شقراء"]
    for g in govs:
        count = await db.reports.count_documents({"governorate": {"$regex": g, "$options": "i"}})
        if count > 0:
            sample = await db.reports.find_one({"governorate": {"$regex": g, "$options": "i"}})
            print(f"Gov: '{g}', Count: {count}, Project: '{sample.get('project')}'")

asyncio.run(search_by_gov())
