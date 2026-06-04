import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    async for w in db.water_connections.find():
        val = w.get('ccb_report_number')
        print(f"VAL: {repr(val)}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
