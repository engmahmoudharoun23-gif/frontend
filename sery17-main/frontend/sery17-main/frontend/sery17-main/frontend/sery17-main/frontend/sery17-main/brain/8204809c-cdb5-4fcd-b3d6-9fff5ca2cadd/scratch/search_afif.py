
import motor.motor_asyncio
import asyncio

async def search_afif():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    # Search for Afif
    count = await db.reports.count_documents({"governorate": {"$regex": "عفيف", "$options": "i"}})
    print(f"Total reports in 'عفيف': {count}")
    
    if count > 0:
        reports = await db.reports.find({"governorate": {"$regex": "عفيف", "$options": "i"}}).to_list(10)
        for r in reports:
            print(f"Report: {r.get('report_number')} | Project: {r.get('project')} | IsDeleted: {r.get('is_deleted')}")
    else:
        # Check all unique govs again
        govs = await db.reports.distinct("governorate")
        print("\nUnique governorates in DB:")
        for g in govs:
            print(f" - '{g}'")

asyncio.run(search_afif())
