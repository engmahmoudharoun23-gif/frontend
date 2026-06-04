import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_conn_dates():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- Dates in water_connections ---")
    docs = await db.water_connections.find({}, {"created_at": 1, "area": 1}).sort("created_at", -1).limit(5).to_list(5)
    for doc in docs:
        print(f"Area: {doc.get('area')}, Created At: {doc.get('created_at')}")
            
    client.close()

if __name__ == "__main__":
    asyncio.run(check_conn_dates())
