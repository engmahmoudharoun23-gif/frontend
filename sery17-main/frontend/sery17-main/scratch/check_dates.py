import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def test():
    # Use the Atlas connection string from .env
    from dotenv import load_dotenv
    load_dotenv('backend/.env')
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'wfm_reports')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Get one report
    report = await db.reports.find_one({"project": {"$regex": "التشوه البصري", "$options": "i"}})
    if report:
        print("created_at:", type(report.get('created_at')), repr(report.get('created_at')))
        print("start_date:", type(report.get('start_date')), repr(report.get('start_date')))
        print("added_at:", type(report.get('added_at')), repr(report.get('added_at')))
    else:
        print("No reports found")

if __name__ == '__main__':
    asyncio.run(test())
