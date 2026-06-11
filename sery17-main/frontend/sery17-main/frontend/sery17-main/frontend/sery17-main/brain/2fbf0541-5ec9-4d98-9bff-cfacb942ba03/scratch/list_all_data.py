import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def list_all():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- ALL REPORTS ---")
    async for r in db.reports.find({"is_deleted": False}):
        print(f"ID: {r.get('id')}, Number: '{r.get('report_number')}'")
        
    print("\n--- ALL WATER CONNECTIONS ---")
    async for w in db.water_connections.find({"is_deleted": False}):
        print(f"ID: {w.get('id')}, CCB: '{w.get('ccb_report_number')}'")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(list_all())
