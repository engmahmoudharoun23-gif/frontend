import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

async def check_deleted_items():
    ROOT_DIR = Path('.')
    load_dotenv(ROOT_DIR / 'backend' / '.env')
    
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"Checking deleted reports...")
    deleted_reports = await db.reports.find({"is_deleted": True}).to_list(100)
    for rep in deleted_reports:
        print(f"Report: {rep.get('report_number')} | Deleted By: {rep.get('deleted_by')} | Deleted At: {rep.get('deleted_at')}")
        
    print(f"\nChecking users...")
    users = await db.users.find({}, {"id": 1, "username": 1, "full_name": 1}).to_list(100)
    for user in users:
        print(f"User: {user.get('username')} | ID: {user.get('id')} | Name: {user.get('full_name')}")

if __name__ == "__main__":
    asyncio.run(check_deleted_items())
