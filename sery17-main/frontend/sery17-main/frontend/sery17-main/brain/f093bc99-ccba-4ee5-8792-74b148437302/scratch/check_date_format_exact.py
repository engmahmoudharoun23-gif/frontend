import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_exact_date_strings():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    docs = await db.reports.find({"project": {"$regex": "المحافظات"}}, {"created_at": 1}).limit(5).to_list(5)
    for doc in docs:
        val = doc.get("created_at")
        print(f"Value: {repr(val)} | Type: {type(val)}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_exact_date_strings())
