import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- WATER CONNECTIONS ---")
    async for w in db.water_connections.find().limit(5):
        print(f"ID: {w.get('id')}, CCB: {w.get('ccb_report_number')}, is_deleted: {w.get('is_deleted')}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
