import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    print("Water Connections sample:")
    conn = await db.water_connections.find_one()
    if conn:
        print(f"  Keys: {list(conn.keys())}")
        print(f"  governorate: {conn.get('governorate')}")
        print(f"  area: {conn.get('area')}")
    
    print("\nSewage Connections sample:")
    conn = await db.sewage_connections.find_one()
    if conn:
        print(f"  Keys: {list(conn.keys())}")
        print(f"  governorate: {conn.get('governorate')}")
        print(f"  area: {conn.get('area')}")

asyncio.run(check())
