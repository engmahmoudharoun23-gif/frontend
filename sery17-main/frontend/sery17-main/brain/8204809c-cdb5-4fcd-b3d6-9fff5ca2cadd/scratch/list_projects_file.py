
import motor.motor_asyncio
import asyncio
import json

async def list_unique_projects():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    projects = await db.reports.distinct("project")
    with open("projects_list.json", "w", encoding="utf-8") as f:
        json.dump(projects, f, ensure_ascii=False, indent=2)

asyncio.run(list_unique_projects())
