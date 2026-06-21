import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def list_data():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    print("--- Water Connections ---")
    async for doc in db.water_connections.find():
        print(doc)
        
    print("\n--- Sewage Connections ---")
    async for doc in db.sewage_connections.find():
        print(doc)
        
    print("\n--- Support Messages ---")
    async for doc in db.support_messages.find():
        print(doc)
        
    client.close()

if __name__ == "__main__":
    asyncio.run(list_data())
