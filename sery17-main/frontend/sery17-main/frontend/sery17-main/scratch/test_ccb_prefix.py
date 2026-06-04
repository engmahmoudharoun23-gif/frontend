import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import sys

# Add backend to path to import models if needed
sys.path.append(os.path.join(os.getcwd(), 'backend'))

async def test_ccb_prefix():
    load_dotenv('backend/.env')
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'wfm_reports')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"Connecting to {db_name}...")
    
    # Check Water Connections
    water_conn = await db.water_connections.find_one({"ccb_report_number": {"$exists": True, "$ne": ""}})
    if water_conn:
        ccb = water_conn.get('ccb_report_number', '')
        print(f"Original Water CCB: {ccb}")
        if not str(ccb).startswith('CCB-'):
            prefixed = f"CCB-{ccb}"
            print(f"Prefixed Water CCB: {prefixed}")
        else:
            print(f"Water CCB already prefixed: {ccb}")
    else:
        print("No water connection with CCB found.")
        
    # Check Sewage Connections
    sewage_conn = await db.sewage_connections.find_one({"ccb_report_number": {"$exists": True, "$ne": ""}})
    if sewage_conn:
        ccb = sewage_conn.get('ccb_report_number', '')
        print(f"Original Sewage CCB: {ccb}")
        if not str(ccb).startswith('CCB-'):
            prefixed = f"CCB-{ccb}"
            print(f"Prefixed Sewage CCB: {prefixed}")
        else:
            print(f"Sewage CCB already prefixed: {ccb}")
    else:
        print("No sewage connection with CCB found.")
        
    # Check Reports
    report = await db.reports.find_one({"report_number": {"$exists": True, "$ne": ""}})
    if report:
        rn = report.get('report_number', '')
        print(f"Original Report Number: {rn}")
        if not str(rn).startswith('CCB-'):
            prefixed = f"CCB-{rn}"
            print(f"Prefixed Report Number: {prefixed}")
        else:
            print(f"Report Number already prefixed: {rn}")
    else:
        print("No report found.")

    client.close()

if __name__ == "__main__":
    asyncio.run(test_ccb_prefix())
