import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_raw_bytes():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- RAW BYTES check for Western project ---")
    projects = await db.reports.distinct("project")
    for p in projects:
        if "المحافظات الغربية" in p:
            print(f"Project: {repr(p)}")
            for char in p:
                print(f"Char: {repr(char)} | Hex: {hex(ord(char))}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_raw_bytes())
