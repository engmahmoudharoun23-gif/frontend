import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def check_data():
    load_dotenv()
    client = AsyncIOMotorClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
    db = client[os.environ.get("DB_NAME", "wfm_reports")]
    report = await db.reports.find_one({})
    print(f"Any Report: {report}")
    client.close()

if __name__ == "__main__":
    asyncio.run(check_data())
