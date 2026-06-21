import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_statuses():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- Statuses in water_connections ---")
    statuses = await db.water_connections.distinct("request_status")
    for s in statuses:
        print(f"'{s}'")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_statuses())
