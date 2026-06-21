import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

async def check_field_types():
    ROOT_DIR = Path('.')
    load_dotenv(ROOT_DIR / 'backend' / '.env')
    
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("Checking deleted reports...")
    reps = await db.reports.find({"is_deleted": True}).to_list(100)
    for r in reps:
        val = r.get('deleted_at')
        print(f"Report {r.get('report_number')}: type={type(val)}, value={val}")

    print("\nChecking deleted invoices...")
    invs = await db.invoices.find({"is_deleted": True}).to_list(100)
    for i in invs:
        val = i.get('deleted_at')
        print(f"Invoice {i.get('invoice_number')}: type={type(val)}, value={val}")

if __name__ == "__main__":
    asyncio.run(check_field_types())
