
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

async def inspect_all_data():
    env_path = Path("d:/sery17-main/sery17-main/backend/.env")
    load_dotenv(dotenv_path=env_path)
    db = AsyncIOMotorClient(os.environ['MONGO_URL'])[os.environ['DB_NAME']]
    
    # 1. Check projects in reports
    report_projects = await db.reports.distinct("project")
    print(f"Projects in reports: {report_projects}")
    
    # 2. Check projects in connections
    water_projects = await db.water_connections.distinct("project")
    print(f"Projects in water_connections: {water_projects}")
    
    sewage_projects = await db.sewage_connections.distinct("project")
    print(f"Projects in sewage_connections: {sewage_projects}")
    
    # 3. Check reports added today (2026-05-15)
    import datetime
    today_start = datetime.datetime(2026, 5, 15, 0, 0, 0)
    today_reports = await db.reports.find({"created_at": {"$gte": today_start}}).to_list(100)
    print(f"Reports added today: {len(today_reports)}")
    for r in today_reports:
        print(f"Report: ID={r.get('id')}, Project='{r.get('project')}', CreatedBy='{r.get('created_by')}', CreatedByName='{r.get('created_by_name')}'")

if __name__ == "__main__":
    asyncio.run(inspect_all_data())
