
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timedelta

async def simulate_query():
    env_path = Path("d:/sery17-main/sery17-main/backend/.env")
    load_dotenv(dotenv_path=env_path)
    db = AsyncIOMotorClient(os.environ['MONGO_URL'])[os.environ['DB_NAME']]
    
    # 1. Simulate hierarchy filter for Shawky
    shawky_id = "b5ae8ee4-b568-4193-be71-fa16d6897af6"
    hierarchy_filter = {"created_by": {"$in": [shawky_id, "Mohamed Shawqi"]}}
    
    # 2. Simulate project filter for "المحافظات الغربية"
    project_regex = ".*المحافظات.*الغربية.*"
    
    # 3. Simulate month filter for "May 2026"
    start_str = "2026-05-01T00:00:00"
    end_str = "2026-06-01T00:00:00"
    date_from_obj = datetime(2026, 5, 1, 0, 0, 0)
    date_to_obj = datetime(2026, 6, 1, 0, 0, 0)
    
    date_filter = {
        "$or": [
            {"created_at": {"$gte": start_str, "$lt": end_str}},
            {"created_at": {"$gte": date_from_obj, "$lt": date_to_obj}}
        ]
    }
    
    query = {
        "is_deleted": {"$ne": True},
        "created_by": hierarchy_filter["created_by"],
        "project": {"$regex": project_regex, "$options": "i"},
        "$or": date_filter["$or"]
    }
    
    print(f"Simulated Query: {query}")
    
    count = await db.reports.count_documents(query)
    print(f"Count: {count}")
    
    # Check without date filter
    query_no_date = {
        "is_deleted": {"$ne": True},
        "created_by": hierarchy_filter["created_by"],
        "project": {"$regex": project_regex, "$options": "i"}
    }
    count_no_date = await db.reports.count_documents(query_no_date)
    print(f"Count (no date): {count_no_date}")

    # Check without project filter
    query_no_proj = {
        "is_deleted": {"$ne": True},
        "created_by": hierarchy_filter["created_by"],
        "$or": date_filter["$or"]
    }
    count_no_proj = await db.reports.count_documents(query_no_proj)
    print(f"Count (no project): {count_no_proj}")

if __name__ == "__main__":
    asyncio.run(simulate_query())
