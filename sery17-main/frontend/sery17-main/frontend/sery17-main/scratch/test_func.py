import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import sys

# Add backend to path
sys.path.append('d:/sery17-main/sery17-main/backend')
import server

class MockUser:
    def __init__(self, d):
        for k, v in d.items():
            setattr(self, k, v)

async def run_test():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    server.db = client['wfm_reports']
    
    user_doc = await server.db.users.find_one({'username': 'Eng Medhat Hussien'})
    user = MockUser(user_doc)
    
    res = await server.get_reports_last_72_hours_list(
        project=None, governorate=None, category="reports", base_date="2026-05-26", current_user=user
    )
    
    print("Reports count:", len(res["reports"]))
    for r in res["reports"]:
        print(f"Report: {r.get('report_number')} - {r.get('project')}")

asyncio.run(run_test())
