import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

async def main():
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    db = client.wfm_reports
    
    print("--- Water Connections ---")
    water_count = await db.water_connections.count_documents({})
    deleted_water_count = await db.water_connections.count_documents({"is_deleted": True})
    print(f"Total: {water_count}, Deleted: {deleted_water_count}")
    
    # Active water connections sample
    print("Active sample:")
    async for w in db.water_connections.find({"is_deleted": {"$ne": True}}).limit(3):
        print(f"  ID: {w.get('id')}, Request#: {w.get('request_number')}, Customer: {w.get('customer_name')}, Project: {w.get('project')}, Gov: {w.get('governorate')}")
        
    print("\n--- Sewage Connections ---")
    sewage_count = await db.sewage_connections.count_documents({})
    deleted_sewage_count = await db.sewage_connections.count_documents({"is_deleted": True})
    print(f"Total: {sewage_count}, Deleted: {deleted_sewage_count}")
    
    # Active sewage connections sample
    print("Active sample:")
    async for s in db.sewage_connections.find({"is_deleted": {"$ne": True}}).limit(3):
        print(f"  ID: {s.get('id')}, Request#: {s.get('request_number')}, Customer: {s.get('customer_name')}, Project: {s.get('project')}, Gov: {s.get('governorate')}")

    print("\n--- Deleted items in database ---")
    print("Deleted water connections:")
    async for w in db.water_connections.find({"is_deleted": True}):
        print(f"  ID: {w.get('id')}, Customer: {w.get('customer_name')}, Deleted By: {w.get('deleted_by')}, Deleted At: {w.get('deleted_at')}")
    print("Deleted sewage connections:")
    async for s in db.sewage_connections.find({"is_deleted": True}):
        print(f"  ID: {s.get('id')}, Customer: {s.get('customer_name')}, Deleted By: {s.get('deleted_by')}, Deleted At: {s.get('deleted_at')}")

if __name__ == '__main__':
    asyncio.run(main())
