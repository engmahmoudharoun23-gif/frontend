import asyncio
import motor.motor_asyncio
import sys

sys.stdout.reconfigure(encoding='utf-8')

client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://localhost:27017')
db = client['wfm_reports']

async def check():
    reports = await db.reports.find({"is_deleted": {"$ne": True}}).to_list(100)
    for r in reports:
        print("REPORT:", r)

asyncio.run(check())
