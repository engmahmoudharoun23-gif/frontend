import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

async def check():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("=== ALL project_governorates records ===")
    govs = await db.project_governorates.find({}, {"_id": 0}).to_list(1000)
    for g in govs:
        project = g.get('project', 'NO_PROJECT')
        name = g.get('name', 'NO_NAME')
        print(f"  PROJECT: [{project}]  NAME: [{name}]")
    
    print(f"\nTotal: {len(govs)} records")
    
    client.close()

asyncio.run(check())
