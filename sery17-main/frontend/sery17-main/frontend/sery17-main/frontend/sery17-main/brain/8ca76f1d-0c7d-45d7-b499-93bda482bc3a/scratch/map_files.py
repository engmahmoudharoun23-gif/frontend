import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def map_files():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    colls = await db.list_collection_names()
    for c in colls:
        stats = await db.command("collStats", c)
        print(f"Collection: {c}")
        print(f"  Count: {stats.get('count')}")
        print(f"  Size: {stats.get('size')}")
        # In WiredTiger, the ident is usually in the stats
        # But we can also look at the uri
        print(f"  WiredTiger: {stats.get('wiredTiger', {}).get('uri')}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(map_files())
