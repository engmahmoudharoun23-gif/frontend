import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_fields():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- water_connections sample ---")
    doc = await db.water_connections.find_one({})
    if doc:
        for k in doc.keys():
            print(f"Field: {k}")
            
    print("\n--- reports sample ---")
    doc_r = await db.reports.find_one({})
    if doc_r:
        for k in doc_r.keys():
            print(f"Field: {k}")
            
    client.close()

if __name__ == "__main__":
    asyncio.run(check_fields())
