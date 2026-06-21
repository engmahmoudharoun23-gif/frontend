import asyncio
import os
import json
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    MONGO_URL = "mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0"
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['wfm_reports']
    
    # Find the most recently created report
    reports = await db.reports.find().sort("created_at", -1).limit(5).to_list(None)
    
    for r in reports:
        # Just print raw dict keys/values for debugging
        print(f"ID: {r.get('id')} | Project: {r.get('project')} | Governorate: {r.get('governorate')}")
        print(f"Is Deleted: {r.get('is_deleted')} | Created At: {r.get('created_at')}")
        # Let's see if there is any field missing that ReportResponse requires
        # For example, does 'contractor' exist?
        print(f"Keys: {list(r.keys())}")
        print("-" * 50)

asyncio.run(main())
