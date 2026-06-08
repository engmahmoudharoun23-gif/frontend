import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_fields():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("\n--- Sewage Connections ---")
    async for s in db.sewage_connections.find().limit(3):
        print(f"ID: {s.get('_id')}, CCB: {s.get('ccb_report_number')}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_fields())
