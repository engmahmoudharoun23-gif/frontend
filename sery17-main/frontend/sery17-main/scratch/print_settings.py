import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient

sys.stdout.reconfigure(encoding='utf-8')

async def print_settings():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("=== PLATFORM SETTINGS ===")
    if "platform_settings" in await db.list_collection_names():
        docs = await db["platform_settings"].find().to_list(100)
        for d in docs:
            print({k: str(v) for k, v in d.items()})
            
    print("\n=== USERS (admin/managers) ===")
    docs = await db["users"].find({"role": {"$in": ["admin", "manager"]}}).to_list(100)
    for d in docs:
        d_clean = {k: str(v) for k, v in d.items() if k != "password" and k != "hashed_password"}
        print(d_clean)
        
    client.close()

if __name__ == "__main__":
    asyncio.run(print_settings())
