import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0')
    db = client.wfm_reports
    
    # Create test collection
    await db.test_array.delete_many({})
    await db.test_array.insert_one({"name": "doc1", "seen_by": ["user1", "user2"]})
    await db.test_array.insert_one({"name": "doc2", "seen_by": ["user2", "user3"]})
    await db.test_array.insert_one({"name": "doc3"})
    
    # Test query
    docs = await db.test_array.find({"seen_by": {"$ne": "user1"}}).to_list(10)
    print("Docs where seen_by $ne user1:")
    for d in docs:
        print(d["name"])

asyncio.run(main())
