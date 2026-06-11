import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.wfm_reports
    
    print("--- Sample water_connections ---")
    cursor = db.water_connections.find({}, {"_id": 0, "project": 1, "created_at": 1}).limit(5)
    async for doc in cursor:
        print(doc)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
