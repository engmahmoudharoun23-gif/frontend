import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_reports_deleted():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- First record in reports collection ---")
    doc = await db.reports.find_one({})
    if doc:
        print(f"ID: {doc.get('id')}")
        print(f"Project: {doc.get('project')}")
        print(f"is_deleted: {doc.get('is_deleted')}")
    else:
        print("No records found")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_reports_deleted())
