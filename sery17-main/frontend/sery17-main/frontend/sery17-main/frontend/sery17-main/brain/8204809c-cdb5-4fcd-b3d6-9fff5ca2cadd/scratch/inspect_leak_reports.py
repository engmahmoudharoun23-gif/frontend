
import motor.motor_asyncio
import asyncio
import json
import re

async def inspect_reports():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    # Search for project "كشف التسربات"
    project_query = {"project": {"$regex": "تسربات", "$options": "i"}}
    reports = await db.reports.find(project_query, {"project": 1, "governorate": 1, "created_by_name": 1, "created_at": 1}).sort("created_at", -1).limit(10).to_list(10)
    
    print("Recent Leak Detection Reports:")
    for r in reports:
        print(f" - Project: '{r.get('project')}', Gov: '{r.get('governorate')}', CreatedBy: '{r.get('created_by_name')}'")

asyncio.run(inspect_reports())
