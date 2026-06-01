import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_deleted_field():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- First record in water_connections ---")
    doc = await db.water_connections.find_one({})
    if doc:
        print(f"ID: {doc.get('id')}")
        print(f"Project: {doc.get('project')}")
        print(f"is_deleted: {doc.get('is_deleted')}")
    else:
        print("No records found")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_deleted_field())
