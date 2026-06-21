import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_conn():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    conn = await db.water_connections.find_one({'request_number': '95362615'})
    print(f"Connection: {conn}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_conn())
