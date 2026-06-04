import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_fields():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- Reports ---")
    async for r in db.reports.find().limit(3):
        print(f"ID: {r.get('_id')}, Num: {r.get('report_number')}")
        
    print("\n--- Water Connections ---")
    async for w in db.water_connections.find().limit(3):
        print(f"ID: {w.get('_id')}, CCB: {w.get('ccb_report_number')}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_fields())
