import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_report_dates():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- Dates in reports collection ---")
    docs = await db.reports.find({}, {"created_at": 1, "project": 1}).limit(5).to_list(5)
    for doc in docs:
        val = doc.get('created_at')
        print(f"Project: {doc.get('project')}, Created At: {val} (Type: {type(val)})")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_report_dates())
