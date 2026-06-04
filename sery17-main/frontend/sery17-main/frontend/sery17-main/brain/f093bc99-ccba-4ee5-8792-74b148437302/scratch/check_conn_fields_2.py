import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_conn_fields():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- water_connections sample data ---")
    docs = await db.water_connections.find({}).limit(1).to_list(1)
    if docs:
        for k, v in docs[0].items():
            print(f"{k}: {v}")
            
    client.close()

if __name__ == "__main__":
    asyncio.run(check_conn_fields())
