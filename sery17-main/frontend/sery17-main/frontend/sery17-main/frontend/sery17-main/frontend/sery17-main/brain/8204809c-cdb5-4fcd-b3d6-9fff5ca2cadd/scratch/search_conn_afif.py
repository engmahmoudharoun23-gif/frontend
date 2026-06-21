
import motor.motor_asyncio
import asyncio

async def search_connections():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    for coll_name in ["water_connections", "sewage_connections"]:
        count = await db[coll_name].count_documents({"area": {"$regex": "عفيف", "$options": "i"}})
        print(f"Collection '{coll_name}', Afif count: {count}")
        
        count_muza = await db[coll_name].count_documents({"area": {"$regex": "المزاحمية", "$options": "i"}})
        print(f"Collection '{coll_name}', Muza count: {count_muza}")

asyncio.run(search_connections())
