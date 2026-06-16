import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    projects = await db.projects.find({}, {"_id": 0, "name": 1}).to_list(100)
    for p in projects:
        print(f"DB_PROJECT: '{p['name']}'")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
