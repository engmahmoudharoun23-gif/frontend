import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

async def simulate_api_call():
    ROOT_DIR = Path('.')
    load_dotenv(ROOT_DIR / 'backend' / '.env')
    
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # ID of Mohamed Shawqi
    user_id = "b5ae8ee4-b568-4193-be71-fa16d6897af6"
    
    base_query = {"is_deleted": True, "deleted_by": user_id}
    
    print(f"Querying reports for user {user_id}...")
    reports = await db.reports.find(base_query).to_list(100)
    print(f"Found {len(reports)} reports.")
    for r in reports:
        print(f"  - {r.get('report_number')} (is_deleted={r.get('is_deleted')}, deleted_by={r.get('deleted_by')})")

if __name__ == "__main__":
    asyncio.run(simulate_api_call())
