import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_areas():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- Areas in water_connections ---")
    areas = await db.water_connections.distinct("area")
    for a in areas:
        print(f"Area: '{a}'")
        
    print("\n--- Governorates in reports ---")
    govs = await db.reports.distinct("governorate")
    for g in govs:
        print(f"Gov: '{g}'")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_areas())
