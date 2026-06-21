import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_keys():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    doc = await db.water_connections.find_one({})
    if doc:
        print("Fields in water_connections:")
        for k in sorted(doc.keys()):
            print(k)
    else:
        print("No documents in water_connections")
            
    client.close()

if __name__ == "__main__":
    asyncio.run(check_keys())
