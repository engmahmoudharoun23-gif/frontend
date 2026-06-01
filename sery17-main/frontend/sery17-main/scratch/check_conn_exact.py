import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_conn():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    conn = await db.water_connections.find_one({'request_number': '95362615'})
    if conn:
        print(f"Gov: {repr(conn.get('governorate'))}")
        print(f"Area: {repr(conn.get('area'))}")
        print(f"Created By: {conn.get('created_by')}")
    else:
        print("Connection not found")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_conn())
