
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

async def check_statuses():
    env_path = Path("d:/sery17-main/sery17-main/backend/.env")
    load_dotenv(dotenv_path=env_path)
    db = AsyncIOMotorClient(os.environ['MONGO_URL'])[os.environ['DB_NAME']]
    
    reports = await db.reports.find({"created_by": "b5ae8ee4-b568-4193-be71-fa16d6897af6"}).to_list(100)
    for r in reports:
        print(f"Report ID: {r.get('id')}, Project: {r.get('project')}, Status: '{r.get('status')}', Type: '{r.get('report_type')}'")

if __name__ == "__main__":
    asyncio.run(check_statuses())
