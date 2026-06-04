import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_raw_bytes():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    print("--- Collection: projects ---")
    async for p in db.projects.find():
        name = p.get('name')
        print(f"Project: {repr(name)} | Bytes: {name.encode('utf-8', errors='replace').hex()}")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_raw_bytes())
