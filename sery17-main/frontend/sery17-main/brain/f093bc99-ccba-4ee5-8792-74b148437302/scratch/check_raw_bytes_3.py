import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_raw_bytes():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- RAW BYTES in reports collection ---")
    projects = await db.reports.distinct("project")
    for p in projects:
        print(f"Project: {repr(p)} | Bytes: {p.encode('utf-8')}")
        
    print("\n--- RAW BYTES in projects collection ---")
    projs = await db.projects.find({}, {"name": 1}).to_list(100)
    for prj in projs:
        name = prj['name']
        print(f"Project Name: {repr(name)} | Bytes: {name.encode('utf-8')}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_raw_bytes())
