
import motor.motor_asyncio
import asyncio

async def count_conns():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    for coll in ["water_connections", "sewage_connections"]:
        total = await db[coll].count_documents({})
        active = await db[coll].count_documents({"is_deleted": {"$ne": True}})
        print(f"Coll {coll}: Total {total}, Active {active}")

asyncio.run(count_conns())
