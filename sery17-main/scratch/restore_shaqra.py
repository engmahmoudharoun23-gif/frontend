import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    local_db = AsyncIOMotorClient('mongodb://localhost:27017')['wfm_reports']
    atlas_db = AsyncIOMotorClient('mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0')['wfm_reports']
    
    deleted_ids = [
        "762c25c7-acae-4bb2-bd0f-ec4aae0e0572",
        "5f37cf7e-6266-4279-82dd-901da395b010",
        # I don't know the other 3 IDs. Let's just find all reports in local for 'شقراء'
    ]
    
    local_reports = await local_db.reports.find({"governorate": {"$regex": "شقراء"}}).to_list(100)
    print(f"Found {len(local_reports)} reports for Shaqra in local DB.")
    
    restored = 0
    for r in local_reports:
        # Check if it exists in Atlas
        exists = await atlas_db.reports.find_one({"id": r["id"]})
        if not exists:
            # Reinsert to Atlas!
            await atlas_db.reports.insert_one(r)
            restored += 1
            print(f"Restored report {r['id']} to Atlas!")
            
    print(f"Total restored: {restored}")

if __name__ == '__main__':
    asyncio.run(test())
