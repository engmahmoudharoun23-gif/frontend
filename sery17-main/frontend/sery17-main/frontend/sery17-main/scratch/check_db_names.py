import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    projects = await db.projects.find({}, {"_id": 0, "name": 1}).to_list(100)
    
    with open('scratch/project_names.json', 'w', encoding='utf-8') as f:
        json.dump(projects, f, ensure_ascii=False, indent=2)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
