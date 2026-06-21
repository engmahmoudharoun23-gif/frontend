import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    count = await db.reports.count_documents({})
    print(f'Reports count: {count}')
    
    # Also check connections if relevant
    conn_count = await db.connections.count_documents({})
    print(f'Connections count: {conn_count}')
    
    # Check if there are any pending or unread notifications
    # (Checking what collections exist)
    collections = await db.list_collection_names()
    print(f'Collections: {collections}')
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
