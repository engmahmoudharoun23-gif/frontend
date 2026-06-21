import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    projects = await db.projects.distinct('name')
    reports_projects = await db.reports.distinct('project')
    
    res = {
        "projects_table": projects,
        "reports_table": reports_projects
    }
    
    with open('scratch/all_projects_debug.json', 'w', encoding='utf-8') as f:
        json.dump(res, f, ensure_ascii=False, indent=2)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
