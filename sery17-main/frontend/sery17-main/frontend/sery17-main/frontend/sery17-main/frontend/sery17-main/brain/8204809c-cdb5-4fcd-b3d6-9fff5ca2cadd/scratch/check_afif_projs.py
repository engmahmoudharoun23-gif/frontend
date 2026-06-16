
import motor.motor_asyncio
import asyncio

async def check_afif_projs():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    projs = await db.reports.find({"governorate": {"$regex": "عفيف", "$options": "i"}}).distinct("project")
    print(f"Projects associated with Afif: {projs}")

asyncio.run(check_afif_projs())
