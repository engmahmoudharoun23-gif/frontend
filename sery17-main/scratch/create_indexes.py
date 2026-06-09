import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def create_indexes():
    print("Connecting to MongoDB Atlas...")
    client = AsyncIOMotorClient("mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0")
    db = client.wfm_reports
    
    collections = [
        "safety_reports",
        "quality_reports", 
        "warehouse_visits",
        "business_reports",
        "work_permits",
        "violations"
    ]
    
    for coll in collections:
        print(f"Creating indexes for {coll}...")
        try:
            await db[coll].create_index([("is_deleted", 1)])
            await db[coll].create_index([("project", 1)])
            await db[coll].create_index([("governorate", 1)])
            await db[coll].create_index([("date", -1)])
            await db[coll].create_index([("project", 1), ("is_deleted", 1)])
            await db[coll].create_index([("created_by", 1)])
            print(f"Indexed {coll}")
        except Exception as e:
            print(f"Error on {coll}: {e}")
            
    print("Done!")

if __name__ == "__main__":
    asyncio.run(create_indexes())
