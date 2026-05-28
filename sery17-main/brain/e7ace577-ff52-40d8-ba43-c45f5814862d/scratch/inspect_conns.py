from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import sys
import codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

async def inspect_connections():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- Water Connection Sample ---")
    async for conn in db.water_connections.find().limit(1):
        print(conn)
        
    print("\n--- Sewage Connection Sample ---")
    async for conn in db.sewage_connections.find().limit(1):
        print(conn)

    client.close()

if __name__ == "__main__":
    asyncio.run(inspect_connections())
