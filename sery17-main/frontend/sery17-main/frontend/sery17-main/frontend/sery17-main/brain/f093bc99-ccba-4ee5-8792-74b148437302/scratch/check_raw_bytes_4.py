import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_raw_bytes():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- RAW BYTES in reports collection ---")
    projects = await db.reports.distinct("project")
    for p in projects:
        if p:
            print(f"Project: {repr(p)} | Bytes: {p.encode('utf-8')}")
        else:
            print("Empty project name")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_raw_bytes())
